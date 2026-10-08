import type { ReactNode } from "react";

/** The small monospace caps label used over readouts and results cells. */
export const kicker = "font-mono text-[0.7rem] tracking-widest uppercase";

/** A label over a value, like an instrument readout; render inside a <dl>. */
export function Tile({ label, tone = "text-slate-100", children }: { label: string; tone?: string; children: ReactNode }) {
  return (
    <div className="rounded-(--radius-control) border border-slate-800 bg-slate-900 px-3 py-2.5">
      <dt className={`${kicker} text-slate-400`}>{label}</dt>
      <dd className={`mt-1 font-mono text-xl font-semibold ${tone}`}>{children}</dd>
    </div>
  );
}
