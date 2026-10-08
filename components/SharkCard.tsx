import type { Shark } from "@/lib/sharks";
import type { SharkState } from "@/lib/types";
import { InterestMeter } from "./InterestMeter";

export function SharkAvatar({ shark, size = "md" }: { shark: Shark; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "size-8 text-xs" : "size-12 text-base";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 font-display font-extrabold ${dims} ${shark.color.border} ${shark.color.bg} ${shark.color.text}`}
    >
      {shark.initials}
    </span>
  );
}

interface Props {
  shark: Shark;
  /** Live state in the tank; omitted on the landing page. */
  state?: SharkState;
  delta?: number;
  asking?: boolean;
  headingLevel?: "h2" | "h3";
}

export function SharkCard({ shark, state, delta, asking = false, headingLevel: H = "h3" }: Props) {
  const out = state?.status === "out";
  return (
    <article
      aria-label={out ? `${shark.name}, out: ${state?.outReason ?? "no longer interested"}` : undefined}
      className={`relative h-full rounded-2xl border bg-slate-900/80 p-4 transition ${
        asking ? `${shark.color.border} ring-1 ring-current ${shark.color.text}` : "border-slate-800"
      } ${out ? "opacity-60 grayscale" : ""}`}
    >
      <div className="flex items-center gap-3">
        <SharkAvatar shark={shark} />
        <div className="min-w-0">
          <H className="font-display text-lg leading-tight font-semibold text-slate-100">{shark.name}</H>
          <p className={`text-sm font-medium ${shark.color.text}`}>{shark.title}</p>
        </div>
      </div>
      <p className="mt-2 text-xs tracking-wide text-slate-300 uppercase">Lens: {shark.lensLabel}</p>
      {state ? (
        <div className="mt-3">
          {asking && !out ? <p className={`mb-2 text-sm font-semibold ${shark.color.text}`}>Asking now</p> : null}
          <InterestMeter name={shark.name.split(" ")[0]} value={state.interest} delta={delta} barClass={shark.color.bar} />
          {out ? (
            <>
              <span className="absolute top-3 right-3 -rotate-6 rounded border-2 border-rose-300 px-2 py-0.5 font-display text-sm font-extrabold tracking-widest text-rose-300">
                OUT
              </span>
              {state.outReason ? <p className="mt-2 text-sm text-slate-200 italic">“{state.outReason}”</p> : null}
            </>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-300">{shark.bio}</p>
      )}
    </article>
  );
}
