import { memo } from "react";
import type { Walkout } from "@/lib/session";
import { DIMENSION_LABELS, SHARKS } from "@/lib/sharks";
import type { Turn } from "@/lib/types";
import { SharkAvatar } from "./SharkCard";

const QUALITY_WORDS = ["", "Weak", "Shaky", "Okay", "Solid", "Excellent"];

/** How the panel rated an answer, e.g. "Okay (3/5)". */
export function ratingText(quality: NonNullable<Turn["quality"]>, vague?: boolean): string {
  return `${QUALITY_WORDS[quality]} (${quality}/5)${vague ? " · the panel found it vague" : ""}`;
}

interface Props {
  turns: Turn[];
  walkouts: Walkout[];
  /** The founder's answer while the panel is reacting to it. */
  pendingAnswer?: string | null;
}

/** Memoised: the tank re-renders on every typed letter of a shark's line, but the transcript only changes per answer. */
export const ChatLog = memo(function ChatLog({ turns, walkouts, pendingAnswer }: Props) {
  let answered = 0;
  return (
    // role="log" sits on a wrapper: on the <ol> itself it would replace the list role and orphan the items.
    <div role="log" aria-live="polite" aria-label="Conversation with the panel">
      <ol className="flex flex-col gap-4">
        {turns.map((turn, i) => {
          const shark = SHARKS[turn.sharkId];
          const isLast = i === turns.length - 1;
          const answer = turn.answer ?? (isLast ? pendingAnswer : null);
          if (turn.answer) answered++;
          const leaving = turn.answer ? walkouts.filter((w) => w.afterAnswer === answered) : [];
          const said = (turn.reactions ?? []).filter((r) => r.line && r.sharkId !== turn.sharkId).slice(0, 2);
          return (
            <li key={i} className="flex flex-col gap-3">
              <div className="animate-rise relative flex gap-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 py-3 pr-4 pl-5">
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${shark.color.bar}`} />
                <SharkAvatar shark={shark} size="sm" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={`font-semibold ${shark.color.text}`}>{shark.name}</span>
                    {turn.isFollowUp ? <span className="rounded-full bg-rose-300 px-2 py-0.5 text-xs font-bold text-slate-950">Follow-up</span> : null}
                    <span className="text-xs text-slate-400">Probing: {DIMENSION_LABELS[turn.probing]}</span>
                  </p>
                  <p className="mt-1 text-slate-100">{turn.question}</p>
                </div>
              </div>

              {answer ? (
                <div className="animate-rise pl-5">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">You</p>
                  <p className="whitespace-pre-wrap text-slate-100">{answer}</p>
                  {turn.quality ? (
                    <p className="mt-1 text-xs text-slate-400">Rated {ratingText(turn.quality, turn.vague)}</p>
                  ) : null}
                </div>
              ) : null}

              {said.length > 0 ? (
                <ul className="ml-5 flex flex-col gap-1 border-l-2 border-slate-700 pl-3 text-sm text-slate-300 italic">
                  {said.map((r) => (
                    <li key={r.sharkId}>
                      <span className={`font-semibold not-italic ${SHARKS[r.sharkId].color.text}`}>{SHARKS[r.sharkId].name.split(" ")[0]}:</span> {r.line}
                    </li>
                  ))}
                </ul>
              ) : null}

              {leaving.map((w) => (
                <p key={w.sharkId} role="note" className="animate-rise rounded-2xl border border-rose-300/50 bg-rose-300/10 px-4 py-2 text-sm text-slate-100">
                  <span className="font-semibold text-rose-300">{SHARKS[w.sharkId].name} is out.</span> “{w.reason}”
                </p>
              ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
});
