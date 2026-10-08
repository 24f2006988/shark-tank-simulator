import "server-only";
import { z } from "zod";
import {
  DIFFICULTY,
  MAX_COUNTERS,
  activeSharks,
  answeredCount,
  applyReactions,
  applyWalkouts,
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
import type { Debrief, Evaluation, NegotiateResult, OffersResult, Question, Source, TurnResult } from "./types";

type Result<T> = Promise<{ data: T; source: Source }>;

const tidy = (s: string, max: number = LIMITS.line.max) => cleanText(s).slice(0, max);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

export async function runTurn({ pitch, sharks, turns }: z.output<typeof turnRequestSchema>): Result<TurnResult> {
  const system = systemPrompt(pitch.difficulty);

  if (turns.length === 0) {
    const { sharkId } = pickNextAsker(sharks, turns, false);
    try {
      const { data } = await generateJson(aiOpeningSchema, { system, prompt: openingPrompt(pitch, sharkId), temperature: 0.8, maxTokens: 400 });
      const next = { sharkId, question: tidy(data.next.question, LIMITS.question.max), probing: data.next.probing, isFollowUp: false };
      return { data: { evaluation: null, sharks, next, over: false }, source: "ai" };
    } catch {
      return { data: { evaluation: null, sharks, next: fallbackQuestion(sharkId, turns, false), over: false }, source: "fallback" };
    }
  }

  const last = turns[turns.length - 1];
  const isFinal = answeredCount(turns) >= DIFFICULTY[pitch.difficulty].maxAnswers;
  const followUp = followUpCandidate(sharks, turns);
  const nextAsker = isFinal ? null : pickNextAsker(sharks, turns, false).sharkId;

  let source: Source = "ai";
  let raw: { quality: number; vague: boolean; reactions: { sharkId: (typeof SHARK_IDS)[number]; delta: number; line: string }[] };
  let aiNext: z.output<typeof aiTurnSchema>["next"] | null = null;
  try {
    const opts = { system, prompt: turnPrompt({ pitch, sharks, turns, followUp, next: nextAsker }), temperature: 0.7, maxTokens: 1200 };
    if (isFinal) {
      raw = (await generateJson(aiFinalTurnSchema, opts)).data.evaluation;
    } else {
      const { data } = await generateJson(aiTurnSchema, opts);
      raw = data.evaluation;
      aiNext = data.next;
    }
  } catch {
    raw = fallbackEvaluation(last.answer ?? "", sharks, last.sharkId);
    source = "fallback";
  }

  // One reaction per shark still in; each delta is reported as the change actually applied.
  const proposed = activeSharks(sharks).map((id) => {
    const r = raw.reactions.find((x) => x.sharkId === id);
    return { sharkId: id, delta: r?.delta ?? 0, line: tidy(r?.line ?? "") };
  });
  const applied = applyReactions(sharks, proposed, pitch.difficulty);
  const reactions = proposed.map((r) => ({ ...r, delta: applied[r.sharkId].interest - sharks[r.sharkId].interest }));
  const reasons = Object.fromEntries(reactions.map((r) => [r.sharkId, r.line]));
  const { sharks: after, walkouts } = applyWalkouts(applied, turns, pitch.difficulty, reasons);
  const evaluation: Evaluation = {
    quality: clamp(raw.quality, 1, 5) as Evaluation["quality"],
    vague: raw.vague,
    reactions,
    walkouts,
  };

  const over = isQuestioningOver(after, turns, pitch.difficulty);
  let next: Question | null = null;
  if (!over) {
    const allowed = new Set([nextAsker, raw.vague ? followUp : null]);
    if (aiNext && allowed.has(aiNext.sharkId) && after[aiNext.sharkId].status === "in" && aiNext.question.trim()) {
      next = {
        sharkId: aiNext.sharkId,
        question: tidy(aiNext.question, LIMITS.question.max),
        probing: aiNext.probing,
        isFollowUp: raw.vague && aiNext.sharkId === last.sharkId,
      };
    } else {
      const pick = pickNextAsker(after, turns, raw.vague);
      next = fallbackQuestion(pick.sharkId, turns, pick.isFollowUp);
    }
  }
  return { data: { evaluation, sharks: after, next, over }, source };
}

export async function runOffers({ pitch, sharks, turns }: z.output<typeof offersRequestSchema>): Result<OffersResult> {
  const fallback = fallbackOffers(pitch, sharks);
  const eligible = eligibleForOffer(sharks, pitch.difficulty);
  if (eligible.length === 0) return { data: fallback, source: "fallback" };
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
      maxTokens: 300,
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
