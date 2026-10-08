import { activeSharks, eligibleForOffer, formatInr } from "./game";
import { DIMENSION_LABELS, SHARKS, SHARK_LIST } from "./sharks";
import type { Deal, Debrief, Dimension, Evaluation, OffersResult, Pitch, Question, SharkId, Sharks, Turn } from "./types";

/** Scripted, deterministic stand-ins so a session never dead-ends when Gemini is down or rate-limited. */

export function fallbackQuestion(sharkId: SharkId, turns: Turn[], isFollowUp: boolean): Question {
  const shark = SHARKS[sharkId];
  if (isFollowUp) return { sharkId, question: shark.followUp, probing: shark.lens, isFollowUp: true };
  const asked = new Set(turns.map((t) => t.question));
  const question = shark.questionBank.find((q) => !asked.has(q)) ?? shark.questionBank[shark.questionBank.length - 1];
  return { sharkId, question, probing: shark.lens, isFollowUp: false };
}

const HEDGES = /\b(not sure|don'?t know|maybe|i think|probably|hopefully|we'?ll see|somehow|a lot of|lots of)\b/gi;
const EVIDENCE = /(\d|rs\.?|₹|%|lakh|crore|customer|revenue|paid|margin|month|users?)/gi;

/** Rates an answer 1-5 from simple signals: length, concrete evidence, hedging. */
export function scoreAnswer(answer: string): Evaluation["quality"] {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const evidence = Math.min(3, answer.match(EVIDENCE)?.length ?? 0);
  const hedges = answer.match(HEDGES)?.length ?? 0;
  let score = 2 + evidence - hedges;
  if (words < 8) score -= 1;
  if (words >= 25) score += 1;
  return Math.min(5, Math.max(1, score)) as Evaluation["quality"];
}

const LINES: Record<number, string> = {
  1: "That didn't answer my question at all.",
  2: "Too vague. I need specifics.",
  3: "Okay, that's a start, but I'm not convinced yet.",
  4: "Good, that's the kind of detail I want.",
  5: "Now that's a strong answer. I'm listening.",
};

export function fallbackEvaluation(answer: string, sharks: Sharks, askerId: SharkId): Omit<Evaluation, "walkouts"> {
  const quality = scoreAnswer(answer);
  const reactions = activeSharks(sharks).map((id) => ({
    sharkId: id,
    delta: id === askerId ? (quality - 3) * 6 : (quality - 3) * 2,
    line: id === askerId ? LINES[quality] : "",
  }));
  return { quality, vague: quality <= 2, reactions };
}

const CONDITIONS: Record<SharkId, string> = {
  vikram: "A royalty of Rs 1 per unit until I recover my investment",
  meera: "I get access to your customer data to plug you into my distribution",
  arjun: "Money is released in two tranches; the second after you ship the core product",
  zara: "I take an advisor seat",
};

export function fallbackOffers(pitch: Pitch, sharks: Sharks): OffersResult {
  const eligible = eligibleForOffer(sharks, pitch.difficulty);
  const offers = eligible.map((id) => {
    const markup = 1 + (100 - sharks[id].interest) / 100;
    return {
      sharkId: id,
      amountLakh: pitch.askLakh,
      equityPct: Math.min(90, Math.round(pitch.equityPct * markup * 2) / 2),
      condition: CONDITIONS[id],
      line: `I like where ${pitch.ideaName} is going. Here's my offer.`,
    };
  });
  const outs = SHARK_LIST.filter((s) => !eligible.includes(s.id)).map((s) => ({
    sharkId: s.id,
    reason: sharks[s.id].outReason ?? `You didn't convince me on ${DIMENSION_LABELS[s.lens].toLowerCase()}. I'm out.`,
  }));
  return { offers, outs };
}

const DIMENSION_FIX: Record<Dimension, string> = {
  economics: "Work out your customer acquisition cost, margin per sale and monthly burn, and say them in one breath.",
  customer: "Collect three named customer stories, ideally people who have paid you.",
  defensibility: "Write down exactly what a funded competitor could not copy in six months, and why.",
  founder: "Prepare a 20-second answer to 'why you' that ties your experience to this problem.",
  market: "Size your market bottom-up: number of buyers times what each pays per year.",
};

export function fallbackDebrief(pitch: Pitch, sharks: Sharks, turns: Turn[], deal: Deal | null): Debrief {
  const answered = turns.filter((t) => t.answer);
  const qualities = answered.map((t) => t.quality ?? scoreAnswer(t.answer ?? ""));
  const avg = qualities.length ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 2;
  const byDimension = (d: Dimension) => {
    const qs = answered.filter((t) => t.probing === d).map((t) => t.quality ?? scoreAnswer(t.answer ?? ""));
    const mean = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : avg;
    return Math.round(mean * 2);
  };
  const scores = {
    economics: byDimension("economics"),
    customer: byDimension("customer"),
    defensibility: byDimension("defensibility"),
    founder: byDimension("founder"),
    market: byDimension("market"),
    answers: Math.round(avg * 2),
  };
  const weakest = answered.reduce<Turn | null>(
    (w, t) => (!w || (t.quality ?? 3) < (w.quality ?? 3) ? t : w),
    null,
  );
  const ranked = (Object.keys(DIMENSION_FIX) as Dimension[]).sort((a, b) => scores[a] - scores[b]);
  return {
    overall: Math.round(avg * 20),
    verdict: deal
      ? `You closed a deal with ${SHARKS[deal.sharkId].name}: ${formatInr(deal.amountLakh)} for ${deal.equityPct}%.`
      : "No deal this time, but every question you struggled with is now on your prep list.",
    scores,
    strengths: ranked.slice(-3).reverse().map((d) => `${DIMENSION_LABELS[d]} came across as one of your stronger areas.`),
    weaknesses: ranked.slice(0, 3).map((d) => `${DIMENSION_LABELS[d]} needed more specifics and evidence.`),
    toughestMoment: {
      question: weakest?.question ?? "Why should we invest?",
      yourAnswer: weakest?.answer ?? "",
      betterAnswer: "Lead with one concrete number or customer example, then explain what it proves in one sentence.",
    },
    sharkWishes: SHARK_LIST.map((s) => ({
      sharkId: s.id,
      wanted: `Clear evidence on ${DIMENSION_LABELS[s.lens].toLowerCase()}${sharks[s.id].status === "out" ? " before they lost interest" : ""}.`,
    })),
    improvedPitch: [
      `${pitch.oneLiner || `${pitch.ideaName} solves a problem people already pay to fix.`}`,
      `Today, [who has the problem] struggle with [the problem], and it costs them [your number].`,
      `${pitch.ideaName} fixes this by ${pitch.description.split(/[.!?]/)[0].trim().toLowerCase() || "[how it works]"}.`,
      "We already have [your traction number], and customers pay [price] with a margin of [your number].",
      `We're raising ${formatInr(pitch.askLakh)} for ${pitch.equityPct}% to reach [next milestone] in [months].`,
    ].join(" "),
    fixes: ranked.slice(0, 3).map((d) => DIMENSION_FIX[d]),
  };
}
