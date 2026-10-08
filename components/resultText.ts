import { formatInr } from "@/lib/game";
import { SHARKS } from "@/lib/sharks";
import type { Deal, Debrief, Pitch } from "@/lib/types";

/** One line on how the pitch ended, e.g. "2 offers, 1 deal: Vikram Rao, Rs 50 lakh for 10%". */
export function outcomeLine(deal: Deal | null, offerCount: number): string {
  const offers = `${offerCount} ${offerCount === 1 ? "offer" : "offers"}`;
  if (!deal) return `${offers}, no deal`;
  return `${offers}, 1 deal: ${SHARKS[deal.sharkId].name}, ${formatInr(deal.amountLakh)} for ${deal.equityPct}%`;
}

/** Short plain-text card to paste into a chat or a post. */
export function resultCardText(d: Debrief, pitch: Pitch, deal: Deal | null, offerCount: number): string {
  return [
    `Shark Tank Simulator: ${pitch.ideaName}`,
    `Asked ${formatInr(pitch.askLakh)} for ${pitch.equityPct}%. Score ${d.overall}/100.`,
    `Result: ${outcomeLine(deal, offerCount)}.`,
    `Toughest question: "${d.toughestMoment.question}"`,
    d.fixes[0] ? `Fix first: ${d.fixes[0]}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
