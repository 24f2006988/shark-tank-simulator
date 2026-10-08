import type { Walkout } from "@/lib/session";
import { DIMENSION_LABELS, SHARKS } from "@/lib/sharks";
import type { Turn } from "@/lib/types";
import { SharkAvatar } from "./SharkCard";

const QUALITY_WORDS = ["", "Weak", "Shaky", "Okay", "Solid", "Excellent"];

interface Props {
  turns: Turn[];
  walkouts: Walkout[];
  /** The founder's answer while the panel is reacting to it. */
  pendingAnswer?: string | null;
}

export function ChatLog({ turns, walkouts, pendingAnswer }: Props) {
  let answered = 0;
  return (
    <ol role="log" aria-live="polite" aria-label="Conversation with the panel" className="flex flex-col gap-4">
      {turns.map((turn, i) => {
        const shark = SHARKS[turn.sharkId];
        const isLast = i === turns.length - 1;
        const answer = turn.answer ?? (isLast ? pendingAnswer : null);
        if (turn.answer) answered++;
        const leaving = turn.answer ? walkouts.filter((w) => w.afterAnswer === answered) : [];
        const said = (turn.reactions ?? []).filter((r) => r.line && r.sharkId !== turn.sharkId).slice(0, 2);
        return (
          <li key={i} className="flex flex-col gap-3">
            <div className="animate-rise flex gap-3">
              <SharkAvatar shark={shark} size="sm" />
              <div className={`max-w-[85%] rounded-2xl rounded-tl-sm border bg-slate-900 px-4 py-3 ${shark.color.border}`}>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`font-semibold ${shark.color.text}`}>{shark.name}</span>
                  {turn.isFollowUp ? (
                    <span className="rounded-full bg-rose-300 px-2 py-0.5 text-xs font-bold text-slate-950">Follow-up</span>
                  ) : null}
                  <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-300">
                    Probing: {DIMENSION_LABELS[turn.probing]}
                  </span>
                </p>
                <p className="mt-1 text-slate-100">{turn.question}</p>
              </div>
            </div>

            {answer ? (
              <div className="animate-rise flex flex-col items-end gap-1">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-amber-300/15 px-4 py-3 text-slate-100">
                  <p className="sr-only">You:</p>
                  <p className="whitespace-pre-wrap">{answer}</p>
                </div>
                {turn.quality ? (
                  <p className="text-xs text-slate-300">
                    Answer rated {QUALITY_WORDS[turn.quality]} ({turn.quality}/5){turn.vague ? " · the panel found it vague" : ""}
                  </p>
                ) : null}
              </div>
            ) : null}

            {said.length > 0 ? (
              <ul className="flex flex-col gap-1 pl-11 text-sm text-slate-300">
                {said.map((r) => (
                  <li key={r.sharkId}>
                    <span className={`font-semibold ${SHARKS[r.sharkId].color.text}`}>{SHARKS[r.sharkId].name.split(" ")[0]}:</span> {r.line}
                  </li>
                ))}
              </ul>
            ) : null}

            {leaving.map((w) => (
              <p key={w.sharkId} role="note" className="animate-rise rounded-lg border border-rose-300/60 bg-rose-300/10 px-4 py-2 text-sm text-slate-100">
                <span className="font-display font-extrabold text-rose-300">{SHARKS[w.sharkId].name} is out.</span> “{w.reason}”
              </p>
            ))}
          </li>
        );
      })}
    </ol>
  );
}
