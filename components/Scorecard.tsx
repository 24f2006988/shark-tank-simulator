import { DIMENSION_LABELS } from "@/lib/sharks";
import type { Debrief } from "@/lib/types";
import { Tile } from "./Readout";
import { TONE_CLASS, scoreBand } from "./verdict";

const ROWS: { key: keyof Debrief["scores"]; label: string }[] = [
  { key: "economics", label: DIMENSION_LABELS.economics },
  { key: "customer", label: DIMENSION_LABELS.customer },
  { key: "defensibility", label: DIMENSION_LABELS.defensibility },
  { key: "founder", label: DIMENSION_LABELS.founder },
  { key: "market", label: DIMENSION_LABELS.market },
  { key: "answers", label: "Handling questions" },
];

/** Six readouts out of 10, coloured by the same bands as the overall score (and spelled out, never colour alone). */
export function Scorecard({ scores }: { scores: Debrief["scores"] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ROWS.map(({ key, label }) => {
        const v = Math.round(scores[key]);
        return (
          <Tile key={key} label={label} tone={TONE_CLASS[scoreBand(v * 10).tone].text}>
            {v}/10
          </Tile>
        );
      })}
    </dl>
  );
}
