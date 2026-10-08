import { SHARK_IDS } from "@/lib/constants";
import { DIFFICULTY } from "@/lib/game";
import { SHARKS } from "@/lib/sharks";
import type { Difficulty, SharkId, Turn } from "@/lib/types";

/**
 * Each shark's interest after every answer, rebuilt from the deltas the panel actually applied. A shark's line ends
 * at the answer that made them walk out (they react to no answer after that).
 */
export function interestSeries(turns: Turn[], start: number): Record<SharkId, number[]> {
  const series = Object.fromEntries(SHARK_IDS.map((id) => [id, [start]])) as Record<SharkId, number[]>;
  const done = new Set<SharkId>();
  for (const turn of turns) {
    for (const id of SHARK_IDS) {
      if (done.has(id)) continue;
      const r = turn.reactions?.find((x) => x.sharkId === id);
      if (!r) {
        done.add(id);
        continue;
      }
      const line = series[id];
      line.push(Math.min(100, Math.max(0, line[line.length - 1] + r.delta)));
    }
  }
  return series;
}

const W = 600;
const H = 220;
const PAD = { left: 30, right: 70, top: 12, bottom: 24 };

/** A line per shark across the game, with the difficulty's offer and walk-out lines for reference. */
export function InterestChart({ turns, difficulty }: { turns: Turn[]; difficulty: Difficulty }) {
  const rules = DIFFICULTY[difficulty];
  const series = interestSeries(turns, rules.startInterest);
  const steps = Math.max(1, turns.length);
  const x = (i: number) => PAD.left + (i / steps) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / 100) * (H - PAD.top - PAD.bottom);
  const summary = SHARK_IDS.map((id) => {
    const s = series[id];
    return `${SHARKS[id].name.split(" ")[0]} ${s[0]} to ${s[s.length - 1]}${s.length - 1 < turns.length ? " (walked out)" : ""}`;
  }).join(", ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Interest over ${turns.length} answers: ${summary}.`} className="h-auto w-full">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="stroke-slate-800" strokeWidth="1" />
          <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" className="fill-slate-400 font-mono text-[11px]">
            {v}
          </text>
        </g>
      ))}
      {[
        { v: rules.offerMin, label: "offers" },
        { v: rules.walkoutBelow, label: "walk-out" },
      ].map((ref) => (
        <g key={ref.label}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(ref.v)} y2={y(ref.v)} className="stroke-slate-500" strokeWidth="1" strokeDasharray="4 4" />
          <text x={W - PAD.right + 6} y={y(ref.v) + 4} className="fill-slate-400 font-mono text-[10px]">
            {ref.label}
          </text>
        </g>
      ))}
      {Array.from({ length: steps + 1 }, (_, i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-slate-400 font-mono text-[10px]">
          {i === 0 ? "start" : `A${i}`}
        </text>
      ))}
      {SHARK_IDS.map((id) => {
        const s = series[id];
        const out = s.length - 1 < turns.length;
        const last = s.length - 1;
        return (
          <g key={id} className={SHARKS[id].color.text}>
            <polyline points={s.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(last)} cy={y(s[last])} r="4" fill={out ? "none" : "currentColor"} stroke="currentColor" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}
