import { DIMENSION_LABELS } from "@/lib/sharks";
import type { Debrief } from "@/lib/types";

const ROWS: { key: keyof Debrief["scores"]; label: string }[] = [
  { key: "economics", label: DIMENSION_LABELS.economics },
  { key: "customer", label: DIMENSION_LABELS.customer },
  { key: "defensibility", label: DIMENSION_LABELS.defensibility },
  { key: "founder", label: DIMENSION_LABELS.founder },
  { key: "market", label: DIMENSION_LABELS.market },
  { key: "answers", label: "Handling questions" },
];

const barColor = (v: number) => (v >= 7 ? "bg-emerald-300" : v >= 4 ? "bg-accent" : "bg-rose-300");

export function Scorecard({ scores }: { scores: Debrief["scores"] }) {
  return (
    <dl className="flex flex-col gap-3">
      {ROWS.map(({ key, label }) => {
        const v = Math.round(scores[key]);
        return (
          <div key={key} className="relative">
            <dt className="text-sm text-slate-200">{label}</dt>
            <dd>
              <span className="absolute top-0 right-0 font-mono text-sm font-semibold">{v}/10</span>
              <span aria-hidden="true" className="mt-1 block h-2 overflow-hidden rounded-full bg-slate-800">
                <span className={`block h-full rounded-full ${barColor(v)}`} style={{ width: `${v * 10}%` }} />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
