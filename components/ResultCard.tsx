import { formatInr } from "@/lib/game";
import type { Deal, Debrief, Pitch } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { outcomeLine, resultCardText } from "./resultText";

interface Props {
  debrief: Debrief;
  pitch: Pitch;
  deal: Deal | null;
  offerCount: number;
}

/** A compact result to screenshot or copy: what you asked, what the panel said, how it ended. */
export function ResultCard({ debrief: d, pitch, deal, offerCount }: Props) {
  return (
    <section aria-labelledby="result-h" className="rounded-md border border-slate-800 border-l-4 border-l-accent bg-accent/10 px-5 py-4">
      <h2 id="result-h" className="text-sm font-semibold tracking-wide text-accent-hover uppercase">
        Your result card
      </h2>
      <p className="mt-1 font-display text-2xl font-semibold">{pitch.ideaName}</p>
      <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-slate-400">The ask</dt>
          <dd className="font-semibold">
            {formatInr(pitch.askLakh)} for {pitch.equityPct}%
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-400">Outcome</dt>
          <dd className="font-semibold">{outcomeLine(deal, offerCount)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-400">Score</dt>
          <dd className="font-semibold">{d.overall}/100</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton text={resultCardText(d, pitch, deal, offerCount)} label="Copy result card" />
      </div>
    </section>
  );
}
