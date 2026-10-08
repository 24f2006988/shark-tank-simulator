/** What the panel says on stage after each API reply, as ordered scripts of lines. Pure functions, unit-tested. */
import { formatInr } from "@/lib/game";
import type { GameSession } from "@/lib/session";
import type { OffersResult, Question, SharkId, TurnResult } from "@/lib/types";
import type { LineInput } from "./useScript";

export const questionLine = (q: Question): LineInput => ({
  sharkId: q.sharkId,
  text: q.question,
  kind: "question",
  followUp: q.isFollowUp,
  probing: q.probing,
});

/**
 * After an answer the panel performs in order: the asker reacts, the most moved other shark chips in,
 * anyone leaving says why, then the next question. Short and sequential, so nothing floods the screen.
 */
export function reactionScript(result: TurnResult, askerId: SharkId): LineInput[] {
  const reactions = result.evaluation?.reactions ?? [];
  const walkouts = result.evaluation?.walkouts ?? [];
  const leaving = new Set(walkouts.map((w) => w.sharkId));
  const lines: LineInput[] = [];
  const asker = reactions.find((r) => r.sharkId === askerId);
  if (asker?.line && !leaving.has(askerId)) lines.push({ sharkId: askerId, text: asker.line, kind: "reaction" });
  const loudest = reactions
    .filter((r) => r.sharkId !== askerId && r.line && !leaving.has(r.sharkId) && Math.abs(r.delta) >= 8)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  if (loudest) lines.push({ sharkId: loudest.sharkId, text: loudest.line, kind: "reaction" });
  for (const w of walkouts) lines.push({ sharkId: w.sharkId, text: w.reason, kind: "out" });
  if (result.next) lines.push(questionLine(result.next));
  return lines;
}

/** Each offer is announced by its shark; sharks who were still in but pass say why. */
export function offerScript(result: OffersResult, sharks: GameSession["sharks"]): LineInput[] {
  return [
    ...result.offers.map(
      (o): LineInput => ({ sharkId: o.sharkId, text: `${o.line} ${formatInr(o.amountLakh)} for ${o.equityPct} percent.`.trim(), kind: "offer" }),
    ),
    ...result.outs
      .filter((o) => sharks[o.sharkId].status === "in")
      .map((o): LineInput => ({ sharkId: o.sharkId, text: o.reason, kind: "out" })),
  ];
}
