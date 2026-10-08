import { formatInr, impliedValuationLakh } from "@/lib/game";
import { SHARKS } from "@/lib/sharks";
import type { Deal } from "@/lib/types";
import { SharkFace } from "./SharkFace";

/** The payoff of an accepted offer, shown while the debrief is being written, so it adds no waiting time. */
export function DealMoment({ deal }: { deal: Deal }) {
  const shark = SHARKS[deal.sharkId];
  return (
    <section aria-labelledby="deal-h" className="tank-set animate-rise flex flex-col items-center gap-3 rounded-2xl border border-slate-800 px-5 py-10 text-center">
      <SharkFace shark={shark} mood="hooked" size={150} />
      <p className={`font-semibold ${shark.color.text}`}>
        {shark.name}, {shark.title}
      </p>
      <h2 id="deal-h" className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        You have a deal
      </h2>
      <p className="font-display text-2xl font-bold">
        {formatInr(deal.amountLakh)} for {deal.equityPct}%
      </p>
      <p className="max-w-md text-pretty text-slate-300">
        That values your company at {formatInr(impliedValuationLakh(deal.amountLakh, deal.equityPct))}.
        {deal.condition ? ` Condition: ${deal.condition.replace(/\.$/, "")}.` : ""}
      </p>
      <div aria-hidden="true" className="mt-3 flex w-full max-w-sm flex-col items-center gap-2">
        <span className="h-2.5 w-full animate-pulse rounded-full bg-slate-800" />
        <span className="h-2.5 w-4/5 animate-pulse rounded-full bg-slate-800" />
        <span className="h-2.5 w-3/5 animate-pulse rounded-full bg-slate-800" />
      </div>
    </section>
  );
}
