"use client";

import { SHARK_IDS } from "@/lib/constants";
import { DIMENSION_LABELS, SHARKS, resolveShark } from "@/lib/sharks";
import type { SharkCustomization, SharkId, Sharks } from "@/lib/types";
import { InterestMeter } from "./InterestMeter";
import { reactionFor } from "./emotes";
import { FaceEmote } from "./FaceEmote";
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
  customPanels?: Partial<Record<SharkId, SharkCustomization>>;
}

/** Horizontal centre of a shark's seat, as a percentage of the row, so the bubble's tail can point at them. */
export function seatCentre(id: SharkId): number {
  return ((SHARK_IDS.indexOf(id) + 0.5) / SHARK_IDS.length) * 100;
}

/** The panel seated in a row like the show, with a speech bubble pointing at whoever is talking. */
export function Stage({ sharks, line, shown, idle, thinking, deltas, round, onSkip, customPanels }: Props) {
  const speaker = line?.sharkId ?? (thinking ? null : idle?.sharkId) ?? null;
  const bubble = line ?? (thinking ? null : idle);
  const barShark = thinking ?? bubble?.sharkId ?? null;
  const typing = line !== null && shown < line.text.length;

  return (
    <section aria-labelledby="stage-h" className="flex flex-col gap-3">
      <h2 id="stage-h" className="sr-only">
        The panel
      </h2>
      <div className="tank-set relative overflow-hidden rounded-2xl border border-slate-800 px-2 pt-4 pb-3 sm:px-5 sm:pt-6">
      <ul className="relative grid grid-cols-4 gap-1 sm:gap-4">
        {SHARK_IDS.map((id) => {
          const shark = resolveShark(id, customPanels?.[id]);
          const state = sharks[id];
          const out = state.status === "out";
          const active = speaker === id || thinking === id;
          const delta = deltas[id];
          // Faces react while the panel performs its reactions (and while weighing an answer), then settle back to their interest.
          const reacting = line !== null;
          const reaction =
            out || !(reacting || thinking === id)
              ? null
              : reactionFor({ id, delta: reacting ? delta : 0, thinking: thinking === id, leaving: line?.sharkId === id && line.kind === "out", round });
          return (
            <li key={id} className="relative flex flex-col items-center gap-1 text-center">
              <div aria-hidden="true" className={`seat-spot absolute inset-x-0 top-0 aspect-square transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`} />
              <div
                className={`relative w-full max-w-72 transition duration-500 ${active ? "scale-105" : "scale-95"} ${out ? "opacity-50 grayscale" : active || !speaker ? "" : "opacity-80"}`}
              >
                <SharkFace
                  shark={shark}
                  mood={reaction?.mood ?? moodFor(state.interest, state.status)}
                  size="100%"
                  talking={line?.sharkId === id}
                  reactionKey={round}
                  delta={delta}
                />
                {reaction?.emote ? <FaceEmote key={`${round}-${id}-${reaction.emote.kind}`} emote={reaction.emote} /> : null}
                {out ? (
                  <span className="absolute top-1/3 left-1/2 -translate-x-1/2 -rotate-12 rounded border-2 border-rose-300 bg-slate-950/80 px-1.5 font-display text-xs font-extrabold tracking-widest text-rose-300 sm:text-sm">
                    OUT
                  </span>
                ) : null}
              </div>
              <div
                className={`relative z-10 -mt-1 w-full max-w-48 rounded-md border bg-slate-950 px-1 py-0.5 transition sm:px-3 sm:py-1.5 ${active ? `${shark.color.border} shadow-[var(--shadow)]` : "border-slate-700"}`}
              >
                <h3 className={`truncate font-display text-sm leading-tight font-semibold sm:text-xl ${active ? "underline decoration-2 underline-offset-4" : ""} ${shark.color.text}`}>
                  {shark.name.split(" ")[0]}
                </h3>
                <p className="hidden truncate text-sm text-slate-300 sm:block">{shark.title}</p>
              </div>
              <div className="w-full max-w-56 md:hidden">
                <InterestMeter name={shark.name.split(" ")[0]} value={state.interest} delta={delta} barClass={shark.color.bar} compact />
              </div>
            </li>
          );
        })}
      </ul>
        {/* The desk the panel sits behind. */}
        <div aria-hidden="true" className="relative mt-3 h-2 rounded-full bg-slate-700" />
      </div>

      <div className="relative">
        {/* A tail on the bubble points up at the shark who is talking. */}
        {barShark ? (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 z-10 size-3 -translate-x-1/2 rotate-45 border-t border-l border-slate-800 bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-slate-950))] transition-[left] duration-500"
            style={{ left: `${seatCentre(barShark)}%` }}
          />
        ) : null}
        {/* Hidden when nobody is speaking (e.g. on the offers stage once the announcements end). */}
        <div className={`relative min-h-28 overflow-hidden rounded-xl border border-slate-800 bg-accent/10 py-4 pr-5 pl-6 ${bubble || thinking ? "" : "hidden"}`}>
          {barShark ? <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${SHARKS[barShark].color.bar}`} /> : null}
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
                    Skip ahead
                  </button>
                ) : null}
              </div>
              <p aria-hidden="true" className={`mt-2 text-lg leading-relaxed text-slate-100 sm:text-xl ${typing ? "type-caret" : ""}`}>
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
