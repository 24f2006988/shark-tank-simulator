"use client";

import { SHARK_IDS } from "@/lib/schemas";
import { DIMENSION_LABELS, SHARKS } from "@/lib/sharks";
import type { SharkId, Sharks } from "@/lib/types";
import { InterestMeter } from "./InterestMeter";
import { SharkFace, moodFor } from "./SharkFace";
import type { Line, LineInput } from "./useScript";
import { btn } from "./ui";

interface Props {
  sharks: Sharks;
  /** The line being performed right now, and how many characters have been typed. */
  line: Line | null;
  shown: number;
  /** What stays in the bubble once the performance ends (usually the open question). */
  idle: LineInput | null;
  /** Shark weighing the founder's answer while the API call runs. */
  thinking: SharkId | null;
  deltas: Partial<Record<SharkId, number>>;
  round: number;
  onSkip?: () => void;
}

/** The panel seated in a row like the show, with a speech bubble pointing at whoever is talking. */
export function Stage({ sharks, line, shown, idle, thinking, deltas, round, onSkip }: Props) {
  const speaker = line?.sharkId ?? (thinking ? null : idle?.sharkId) ?? null;
  const bubble = line ?? (thinking ? null : idle);
  const pointer = thinking ?? bubble?.sharkId ?? null;
  const typing = line !== null && shown < line.text.length;

  return (
    <section aria-labelledby="stage-h" className="flex flex-col gap-3">
      <h2 id="stage-h" className="sr-only">
        The panel
      </h2>
      <ul className="grid grid-cols-4 gap-2 sm:gap-4">
        {SHARK_IDS.map((id) => {
          const shark = SHARKS[id];
          const state = sharks[id];
          const out = state.status === "out";
          const active = speaker === id || thinking === id;
          const delta = deltas[id];
          return (
            <li key={id} className="relative flex flex-col items-center gap-1 text-center">
              <div aria-hidden="true" className={`seat-spot absolute inset-x-0 top-0 h-28 transition-opacity duration-500 sm:h-36 ${active ? "opacity-100" : "opacity-0"}`} />
              <div
                className={`relative w-16 transition duration-500 sm:w-24 lg:w-28 ${active ? "scale-110" : "scale-95"} ${out ? "opacity-50 grayscale" : active || !speaker ? "" : "opacity-70"}`}
              >
                <SharkFace
                  shark={shark}
                  mood={moodFor(state.interest, state.status)}
                  size="100%"
                  talking={line?.sharkId === id}
                  reactionKey={round}
                  delta={delta}
                />
                {out ? (
                  <span className="absolute top-1/3 left-1/2 -translate-x-1/2 -rotate-12 rounded border-2 border-rose-300 bg-slate-950/80 px-1.5 font-display text-xs font-extrabold tracking-widest text-rose-300 sm:text-sm">
                    OUT
                  </span>
                ) : null}
              </div>
              <h3 className={`text-sm leading-tight font-semibold sm:text-base ${shark.color.text}`}>{shark.name.split(" ")[0]}</h3>
              <p className="hidden text-xs text-slate-400 sm:block">{shark.title}</p>
              <div className="w-full max-w-28">
                <InterestMeter name={shark.name.split(" ")[0]} value={state.interest} delta={delta} barClass={shark.color.bar} compact />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="relative">
        {pointer ? (
          <span
            aria-hidden="true"
            className="absolute -top-2 size-4 rotate-45 border-t border-l border-slate-600 bg-slate-900 transition-[left] duration-500"
            style={{ left: `calc(${(SHARK_IDS.indexOf(pointer) + 0.5) * 25}% - 8px)` }}
          />
        ) : null}
        <div className="min-h-28 rounded-lg border border-slate-600 bg-slate-900 px-5 py-4">
          {thinking && !line ? (
            <p className="flex items-center gap-3 text-slate-300">
              <span className={`font-semibold ${SHARKS[thinking].color.text}`}>{SHARKS[thinking].name}</span>
              <span aria-hidden="true" className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="think-dot size-2 rounded-full bg-slate-300" style={{ animationDelay: `${i * 0.18}s` }} />
                ))}
              </span>
            </p>
          ) : bubble ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`font-semibold ${SHARKS[bubble.sharkId].color.text}`}>{SHARKS[bubble.sharkId].name}</span>
                {bubble.followUp ? <span className="rounded-full bg-rose-300 px-2 py-0.5 text-xs font-bold text-slate-950">Follow-up</span> : null}
                {bubble.probing ? (
                  <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-300">Probing: {DIMENSION_LABELS[bubble.probing]}</span>
                ) : null}
                {bubble.kind === "out" ? <span className="rounded-full bg-rose-400 px-2 py-0.5 text-xs font-bold text-slate-950">I&apos;m out</span> : null}
                {line && onSkip ? (
                  <button type="button" onClick={onSkip} className={`${btn.ghost} ml-auto min-h-9 py-1 text-sm`}>
                    Skip to the question
                  </button>
                ) : null}
              </div>
              <p aria-hidden="true" className={`mt-2 text-lg leading-relaxed text-slate-50 sm:text-xl ${typing ? "type-caret" : ""}`}>
                {line ? line.text.slice(0, shown) : bubble.text}
              </p>
            </>
          ) : null}
        </div>
        {/* Screen readers get each full line at once instead of the typewriter effect. */}
        <p aria-live="polite" className="sr-only">
          {bubble ? `${SHARKS[bubble.sharkId].name}${bubble.followUp ? ", follow-up" : ""}: ${bubble.text}` : ""}
        </p>
      </div>
    </section>
  );
}
