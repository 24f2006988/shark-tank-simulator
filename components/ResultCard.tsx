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

/** The result to copy and share, inside the verdict: what you asked and how it ended (the score ring sits beside it). */
export function ResultCard({ debrief: d, pitch, deal, offerCount }: Props) {
  return (
    <div className="mt-4 border-t border-slate-800 pt-4">
      <h3 className="sr-only">Your result card</h3>
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
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
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton text={resultCardText(d, pitch, deal, offerCount)} label="Copy result card" />
      </div>
    </div>
  );
}
