import { SHARK_IDS } from "./schemas";
import type { Difficulty, Offer, Pitch, Reaction, SharkId, Sharks, Terms, Turn } from "./types";

export interface DifficultyRules {
  label: string;
  startInterest: number;
  /** Multiplier applied to negative interest changes. */
  negativeMultiplier: number;
  walkoutBelow: number;
  offerMin: number;
  maxAnswers: number;
  /** Max valuation gap (fraction) a shark accepts when countered. */
  acceptGap: number;
}

export const DIFFICULTY: Record<Difficulty, DifficultyRules> = {
  friendly: { label: "Friendly", startInterest: 60, negativeMultiplier: 0.6, walkoutBelow: 10, offerMin: 45, maxAnswers: 6, acceptGap: 0.2 },
  realistic: { label: "Realistic", startInterest: 50, negativeMultiplier: 1, walkoutBelow: 20, offerMin: 55, maxAnswers: 7, acceptGap: 0.1 },
  ruthless: { label: "Ruthless", startInterest: 40, negativeMultiplier: 1.4, walkoutBelow: 30, offerMin: 65, maxAnswers: 8, acceptGap: 0.05 },
};

/** Answers before anyone may walk out, so nobody leaves on the first exchange. */
export const WALKOUT_GRACE_ANSWERS = 2;
/** The original question plus at most two follow-ups from the same shark in a row. */
export const MAX_SAME_SHARK_STREAK = 3;
export const MIN_ANSWERS_BEFORE_OFFERS = 4;
export const MAX_COUNTERS = 2;
/** Sharks who did not ask the question react, but only mildly, so one answer cannot sink the whole panel. */
export const BYSTANDER_MAX_DELTA = 6;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const roundHalf = (n: number) => Math.round(n * 2) / 2;

export function createSharks(difficulty: Difficulty): Sharks {
  const interest = DIFFICULTY[difficulty].startInterest;
  return Object.fromEntries(SHARK_IDS.map((id) => [id, { id, interest, status: "in" }])) as Sharks;
}

export function activeSharks(sharks: Sharks): SharkId[] {
  return SHARK_IDS.filter((id) => sharks[id].status === "in");
}

export function answeredCount(turns: Turn[]): number {
  return turns.filter((t) => t.answer).length;
}

export function questionsAsked(turns: Turn[], id: SharkId): number {
  return turns.filter((t) => t.sharkId === id).length;
}

/** How many of the latest turns in a row were asked by this shark. */
export function streak(turns: Turn[], id: SharkId): number {
  let n = 0;
  for (let i = turns.length - 1; i >= 0 && turns[i].sharkId === id; i--) n++;
  return n;
}

export function clampDelta(delta: number, difficulty: Difficulty): number {
  const d = clamp(Math.round(delta), -20, 20);
  return d < 0 ? Math.round(d * DIFFICULTY[difficulty].negativeMultiplier) : d;
}

export function capBystanders(reactions: Reaction[], askerId: SharkId): Reaction[] {
  return reactions.map((r) =>
    r.sharkId === askerId ? r : { ...r, delta: clamp(r.delta, -BYSTANDER_MAX_DELTA, BYSTANDER_MAX_DELTA) },
  );
}

/** Applies interest changes to sharks still in; unknown or departed sharks are ignored. */
export function applyReactions(sharks: Sharks, reactions: Reaction[], difficulty: Difficulty): Sharks {
  const next = structuredClone(sharks);
  for (const r of reactions) {
    const shark = next[r.sharkId];
    if (!shark || shark.status !== "in") continue;
    shark.interest = clamp(shark.interest + clampDelta(r.delta, difficulty), 0, 100);
  }
  return next;
}

/**
 * Sharks whose interest fell below the difficulty threshold walk out, after the grace period.
 * The last shark standing stays until questioning ends, so the founder always faces someone.
 */
export function applyWalkouts(
  sharks: Sharks,
  turns: Turn[],
  difficulty: Difficulty,
  reasons: Partial<Record<SharkId, string>> = {},
): { sharks: Sharks; walkouts: { sharkId: SharkId; reason: string }[] } {
  if (answeredCount(turns) < WALKOUT_GRACE_ANSWERS) return { sharks, walkouts: [] };
  const threshold = DIFFICULTY[difficulty].walkoutBelow;
  const active = activeSharks(sharks);
  let leaving = active.filter((id) => sharks[id].interest < threshold);
  if (leaving.length === active.length && answeredCount(turns) < DIFFICULTY[difficulty].maxAnswers) {
    const keeper = [...leaving].sort((a, b) => sharks[b].interest - sharks[a].interest)[0];
    leaving = leaving.filter((id) => id !== keeper);
  }
  const next = structuredClone(sharks);
  const walkouts = leaving.map((id) => {
    const reason = reasons[id]?.trim() || "You haven't convinced me. I'm out.";
    next[id].status = "out";
    next[id].outReason = reason;
    return { sharkId: id, reason };
  });
  return { sharks: next, walkouts };
}

/** The shark allowed to press with a follow-up after the latest answer, if any. */
export function followUpCandidate(sharks: Sharks, turns: Turn[]): SharkId | null {
  const last = turns.at(-1);
  if (!last || sharks[last.sharkId].status !== "in") return null;
  return streak(turns, last.sharkId) < MAX_SAME_SHARK_STREAK ? last.sharkId : null;
}

/**
 * Who asks next: a vague answer earns a follow-up from the same shark; otherwise the shark who
 * has asked least, ties going to the least interested one (the one the founder must win over).
 */
export function pickNextAsker(sharks: Sharks, turns: Turn[], lastVague: boolean): { sharkId: SharkId; isFollowUp: boolean } {
  const follow = lastVague ? followUpCandidate(sharks, turns) : null;
  if (follow) return { sharkId: follow, isFollowUp: true };
  const active = activeSharks(sharks);
  const lastId = turns.at(-1)?.sharkId;
  const pool = active.length > 1 ? active.filter((id) => id !== lastId) : active;
  const order = (pool.length ? pool : SHARK_IDS.slice()).sort(
    (a, b) =>
      questionsAsked(turns, a) - questionsAsked(turns, b) ||
      sharks[a].interest - sharks[b].interest ||
      SHARK_IDS.indexOf(a) - SHARK_IDS.indexOf(b),
  );
  return { sharkId: order[0], isFollowUp: false };
}

export function isQuestioningOver(sharks: Sharks, turns: Turn[], difficulty: Difficulty): boolean {
  return answeredCount(turns) >= DIFFICULTY[difficulty].maxAnswers || activeSharks(sharks).length === 0;
}

export function eligibleForOffer(sharks: Sharks, difficulty: Difficulty): SharkId[] {
  return activeSharks(sharks).filter((id) => sharks[id].interest >= DIFFICULTY[difficulty].offerMin);
}

export function sanitizeTerms(terms: Terms, pitch: Pitch): Terms {
  return {
    amountLakh: clamp(roundHalf(terms.amountLakh), 1, Math.max(1, pitch.askLakh * 2)),
    equityPct: clamp(roundHalf(terms.equityPct), 1, 90),
  };
}

export function sanitizeOffer(offer: Offer, pitch: Pitch): Offer {
  const condition = offer.condition?.trim();
  return { ...offer, ...sanitizeTerms(offer, pitch), condition: condition || undefined };
}

/** Post-money valuation in Rs lakh implied by an amount for a stake. */
export function impliedValuationLakh(amountLakh: number, equityPct: number): number {
  return (amountLakh * 100) / equityPct;
}

export function formatInr(lakh: number): string {
  const tidy = (n: number) => Number(n.toFixed(2)).toLocaleString("en-IN");
  return lakh >= 100 ? `Rs ${tidy(lakh / 100)} crore` : `Rs ${tidy(lakh)} lakh`;
}

/**
 * Deterministic negotiation used when Gemini is unavailable. Founders counter for a higher
 * valuation; a small gap is accepted, a moderate one is met halfway, a large one ends talks.
 */
export function fallbackNegotiate(offer: Offer, counter: Terms, counters: number, difficulty: Difficulty) {
  const offerVal = impliedValuationLakh(offer.amountLakh, offer.equityPct);
  const counterVal = impliedValuationLakh(counter.amountLakh, counter.equityPct);
  const gap = (counterVal - offerVal) / offerVal;
  if (gap <= DIFFICULTY[difficulty].acceptGap) {
    return { response: "accept" as const, ...counter, line: "You drive a fair bargain. You've got a deal." };
  }
  if (counters >= MAX_COUNTERS || gap > 0.4) {
    return { response: "walk" as const, ...offer, line: "We're too far apart. I'm withdrawing my offer." };
  }
  const midVal = (offerVal + counterVal) / 2;
  return {
    response: "counter" as const,
    amountLakh: counter.amountLakh,
    equityPct: roundHalf(clamp((counter.amountLakh * 100) / midVal, 1, 90)),
    line: "Let's meet in the middle. Same money, but I need a bit more equity.",
  };
}
