/** Pure helpers that turn debrief scores and offer terms into short, plain labels for the UI. */

export type Tone = "good" | "mid" | "low";

export interface Band {
  label: string;
  tone: Tone;
}

/** Overall score (0-100) to a verdict band; the thresholds match how the scorecard colours each row. */
export function scoreBand(overall: number): Band {
  if (overall >= 70) return { label: "Investor-ready", tone: "good" };
  if (overall >= 40) return { label: "Promising, with gaps", tone: "mid" };
  return { label: "Not ready yet", tone: "low" };
}

/** Compares a shark's implied valuation with the founder's, e.g. "12% below your valuation". */
export function valuationGap(offerValLakh: number, askValLakh: number): { pct: number; label: string; tone: Tone } {
  if (!(askValLakh > 0) || !Number.isFinite(offerValLakh)) return { pct: 0, label: "Matches your valuation", tone: "good" };
  const pct = Math.round(((offerValLakh - askValLakh) / askValLakh) * 100);
  if (pct === 0) return { pct, label: "Matches your valuation", tone: "good" };
  if (pct > 0) return { pct, label: `${pct}% above your valuation`, tone: "good" };
  return { pct, label: `${-pct}% below your valuation`, tone: pct <= -25 ? "low" : "mid" };
}

/** Text, stroke and tint classes per tone; all pass WCAG AA in both themes (the status colours are theme variables). */
export const TONE_CLASS: Record<Tone, { text: string; stroke: string; chip: string }> = {
  good: { text: "text-emerald-300", stroke: "stroke-emerald-300", chip: "border-emerald-300/60 text-emerald-300" },
  mid: { text: "text-accent", stroke: "stroke-accent", chip: "border-accent/60 text-accent" },
  low: { text: "text-rose-300", stroke: "stroke-rose-300", chip: "border-rose-300/60 text-rose-300" },
};
