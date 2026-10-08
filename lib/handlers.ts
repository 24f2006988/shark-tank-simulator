import "server-only";
import { z } from "zod";
import {
  DIFFICULTY,
  MAX_COUNTERS,
  activeSharks,
  answeredCount,
  applyReactions,
  applyWalkouts,
  capBystanders,
  eligibleForOffer,
  fallbackNegotiate,
  followUpCandidate,
  impliedValuationLakh,
  isQuestioningOver,
  pickNextAsker,
  sanitizeOffer,
  sanitizeTerms,
} from "./game";
import { fallbackDebrief, fallbackEvaluation, fallbackOffers, fallbackQuestion } from "./fallback";
import { generateJson } from "./gemini";
import { SHARKS } from "./sharks";
import { debriefPrompt, negotiatePrompt, offersPrompt, openingPrompt, systemPrompt, turnPrompt } from "./prompts";
import {
  LIMITS,
  SHARK_IDS,
  aiFinalTurnSchema,
  aiNegotiateSchema,
  aiOffersSchema,
  aiOpeningSchema,
  aiTurnSchema,
  cleanText,
  debriefRequestSchema,
  debriefSchema,
  negotiateRequestSchema,
  offersRequestSchema,
  turnRequestSchema,
} from "./schemas";
import type { Debrief, Evaluation, NegotiateResult, OffersResult, Question, SharkId, Sharks, Source, Turn, TurnResult } from "./types";

type Result<T> = Promise<{ data: T; source: Source }>;

// Output limits include the model's thinking tokens; below about 800, short replies came back as cut-off JSON.

// 14 s per attempt: flash-lite normally answers in about 4 s, and a stalled attempt still leaves about 21 s for gemini-3.5-flash (about 15 s).
export const DEBRIEF_ATTEMPT_MS = 14_000;
export const DEBRIEF_BUDGET_MS = 35_000;

const tidy = (s: string, max: number = LIMITS.line.max) => cleanText(s).slice(0, max);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

type TurnRequest = z.output<typeof turnRequestSchema>;
type AiEvaluation = z.output<typeof aiTurnSchema>["evaluation"];
type AiQuestion = z.output<typeof aiTurnSchema>["next"];

export async function runTurn(request: TurnRequest): Result<TurnResult> {
  if (request.turns.length === 0) return openingTurn(request);
  const { pitch, sharks, turns } = request;
  const followUp = followUpCandidate(sharks, turns);
  const { raw, aiNext, source } = await judgeAnswer(request, followUp);
  const { evaluation, after } = applyEvaluation(raw, request);
  const over = isQuestioningOver(after, turns, pitch.difficulty);
  const next = over ? null : chooseNext(aiNext, after, turns, raw.vague, followUp);
  return { data: { evaluation, sharks: after, next, over }, source };
}

async function openingTurn({ pitch, sharks, turns }: TurnRequest): Result<TurnResult> {
  const { sharkId } = pickNextAsker(sharks, turns, false);
  try {
    const { data } = await generateJson(aiOpeningSchema, {
      system: systemPrompt(pitch.difficulty),
      prompt: openingPrompt(pitch, sharkId),
      temperature: 0.8,
      maxTokens: 800,
    });
    const next = { sharkId, question: tidy(data.next.question, LIMITS.question.max), probing: data.next.probing, isFollowUp: false };
    return { data: { evaluation: null, sharks, next, over: false }, source: "ai" };
  } catch {
    return { data: { evaluation: null, sharks, next: fallbackQuestion(sharkId, turns, false), over: false }, source: "fallback" };
  }
}

/** One Gemini call judges the latest answer and, unless this was the last answer, drafts the next question. */
async function judgeAnswer(
  { pitch, sharks, turns }: TurnRequest,
  followUp: SharkId | null,
): Promise<{ raw: AiEvaluation; aiNext: AiQuestion | null; source: Source }> {
  const isFinal = answeredCount(turns) >= DIFFICULTY[pitch.difficulty].maxAnswers;
  const nextAsker = isFinal ? null : pickNextAsker(sharks, turns, false).sharkId;
  const opts = {
    system: systemPrompt(pitch.difficulty),
    prompt: turnPrompt({ pitch, sharks, turns, followUp, next: nextAsker }),
    temperature: 0.7,
    maxTokens: 1200,
  };
  try {
    if (isFinal) return { raw: (await generateJson(aiFinalTurnSchema, opts)).data.evaluation, aiNext: null, source: "ai" };
    const { data } = await generateJson(aiTurnSchema, opts);
    return { raw: data.evaluation, aiNext: data.next, source: "ai" };
  } catch {
    const last = turns[turns.length - 1];
    return { raw: fallbackEvaluation(last.answer ?? "", sharks, last.sharkId), aiNext: null, source: "fallback" };
  }
}

/** Applies one capped reaction per shark still in, then walkouts; each delta is reported as the change actually applied. */
function applyEvaluation(raw: AiEvaluation, { pitch, sharks, turns }: TurnRequest): { evaluation: Evaluation; after: Sharks } {
  const askerId = turns[turns.length - 1].sharkId;
  const proposed = capBystanders(
    activeSharks(sharks).map((id) => {
      const r = raw.reactions.find((x) => x.sharkId === id);
      return { sharkId: id, delta: r?.delta ?? 0, line: tidy(r?.line ?? "") };
    }),
    askerId,
  );
  const applied = applyReactions(sharks, proposed, pitch.difficulty);
  const reactions = proposed.map((r) => ({ ...r, delta: applied[r.sharkId].interest - sharks[r.sharkId].interest }));
  const reasons = Object.fromEntries(reactions.map((r) => [r.sharkId, r.line]));
  const { sharks: after, walkouts } = applyWalkouts(applied, turns, pitch.difficulty, reasons);
  const quality = clamp(raw.quality, 1, 5) as Evaluation["quality"];
  return { evaluation: { quality, vague: raw.vague, reactions, walkouts }, after };
}

/**
 * Prefers the AI's question, which is shaped by the founder's answers, over a scripted one.
 * Any shark still in may ask; the shark who just asked may press on only within the follow-up
 * streak cap. A question drafted for a shark who has just walked out passes to a shark still in,
 * preferring the one whose lens matches its topic.
 */
function chooseNext(aiNext: AiQuestion | null, sharks: Sharks, turns: Turn[], vague: boolean, followUp: SharkId | null): Question {
  const lastId = turns[turns.length - 1].sharkId;
  const pick = pickNextAsker(sharks, turns, vague);
  if (!aiNext?.question.trim()) return fallbackQuestion(pick.sharkId, turns, pick.isFollowUp);

  const question = tidy(aiNext.question, LIMITS.question.max);
  const active = activeSharks(sharks);
  if (sharks[aiNext.sharkId].status === "out") {
    const heir = active.find((id) => id !== lastId && SHARKS[id].lens === aiNext.probing) ?? pick.sharkId;
    return { sharkId: heir, question, probing: aiNext.probing, isFollowUp: false };
  }
  const mayAsk = aiNext.sharkId !== lastId || followUp === lastId || active.length === 1;
  if (!mayAsk) return fallbackQuestion(pick.sharkId, turns, pick.isFollowUp);
  return { sharkId: aiNext.sharkId, question, probing: aiNext.probing, isFollowUp: aiNext.sharkId === lastId && vague };
}

export async function runOffers({ pitch, sharks, turns }: z.output<typeof offersRequestSchema>): Result<OffersResult> {
  const fallback = fallbackOffers(pitch, sharks);
  const eligible = eligibleForOffer(sharks, pitch.difficulty);
  // Everyone already walked out: their reasons were written by Gemini during questioning, so no new call.
  if (activeSharks(sharks).length === 0) return { data: fallback, source: "ai" };
  try {
    const { data } = await generateJson(aiOffersSchema, {
      system: systemPrompt(pitch.difficulty),
      prompt: offersPrompt(pitch, sharks, turns),
      temperature: 0.8,
      maxTokens: 900,
    });
    const offers = eligible.map((id) => {
      const o = data.offers.find((x) => x.sharkId === id);
      if (!o) return fallback.offers.find((x) => x.sharkId === id)!;
      return sanitizeOffer({ sharkId: id, amountLakh: o.amountLakh, equityPct: o.equityPct, condition: tidy(o.condition), line: tidy(o.line) }, pitch);
    });
    const outs = fallback.outs.map((out) => {
      const ai = data.outs.find((x) => x.sharkId === out.sharkId);
      return sharks[out.sharkId].status === "in" && ai?.reason.trim() ? { ...out, reason: tidy(ai.reason) } : out;
    });
    return { data: { offers, outs }, source: "ai" };
  } catch {
    return { data: fallback, source: "fallback" };
  }
}

export async function runNegotiate({ pitch, offer, counter, counters }: z.output<typeof negotiateRequestSchema>): Result<NegotiateResult> {
  const terms = sanitizeTerms(counter, pitch);
  const scripted = fallbackNegotiate(offer, terms, counters, pitch.difficulty);
  if (counters >= MAX_COUNTERS) return { data: scripted, source: "fallback" };
  try {
    const { data } = await generateJson(aiNegotiateSchema, {
      system: systemPrompt(pitch.difficulty),
      prompt: negotiatePrompt(pitch, offer, terms, counters),
      temperature: 0.7,
      maxTokens: 800,
    });
    const line = tidy(data.line);
    if (data.response === "accept") return { data: { response: "accept", ...terms, line }, source: "ai" };
    if (data.response === "walk") return { data: { response: "walk", amountLakh: offer.amountLakh, equityPct: offer.equityPct, line }, source: "ai" };
    const proposal = sanitizeTerms(data, pitch);
    // A "counter" at or above the founder's own valuation is really an acceptance.
    if (impliedValuationLakh(proposal.amountLakh, proposal.equityPct) >= impliedValuationLakh(terms.amountLakh, terms.equityPct)) {
      return { data: { response: "accept", ...terms, line }, source: "ai" };
    }
    return { data: { response: "counter", ...proposal, line }, source: "ai" };
  } catch {
    return { data: scripted, source: "fallback" };
  }
}

export async function runDebrief({ pitch, sharks, turns, deal }: z.output<typeof debriefRequestSchema>): Result<Debrief> {
  try {
    const { data } = await generateJson(debriefSchema, {
      system: systemPrompt(pitch.difficulty),
      prompt: debriefPrompt(pitch, sharks, turns, deal),
      temperature: 0.4,
      maxTokens: 3000,
      // The longest reply in the game (scorecard plus a rewritten pitch); the client waits up to 45 s.
      attemptMs: DEBRIEF_ATTEMPT_MS,
      budgetMs: DEBRIEF_BUDGET_MS,
    });
    const three = (xs: string[]) => xs.slice(0, 3).map((x) => tidy(x, 400));
    const debrief: Debrief = {
      overall: clamp(data.overall, 0, 100),
      verdict: tidy(data.verdict, 300),
      scores: Object.fromEntries(Object.entries(data.scores).map(([k, v]) => [k, clamp(v, 0, 10)])) as Debrief["scores"],
      strengths: three(data.strengths),
      weaknesses: three(data.weaknesses),
      toughestMoment: {
        question: tidy(data.toughestMoment.question, LIMITS.question.max),
        yourAnswer: tidy(data.toughestMoment.yourAnswer, LIMITS.answer.max),
        betterAnswer: tidy(data.toughestMoment.betterAnswer, 600),
      },
      sharkWishes: SHARK_IDS.map((id) => ({ sharkId: id, wanted: tidy(data.sharkWishes.find((w) => w.sharkId === id)?.wanted ?? "", 300) })).filter((w) => w.wanted),
      improvedPitch: tidy(data.improvedPitch, 1500),
      fixes: three(data.fixes),
    };
    return { data: debrief, source: "ai" };
  } catch {
    return { data: fallbackDebrief(pitch, sharks, turns, deal), source: "fallback" };
  }
}
