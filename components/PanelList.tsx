import { memo } from "react";
import { SHARK_LIST } from "@/lib/sharks";
import type { SharkId, Sharks } from "@/lib/types";
import { InterestMeter } from "./InterestMeter";
import { SharkFace, moodFor, type Mood } from "./SharkFace";

const NO_DELTAS: Partial<Record<SharkId, number>> = {};

const RESTING: Record<SharkId, Mood> = { vikram: "neutral", meera: "warm", arjun: "doubtful", zara: "hooked" };

interface Props {
  /** Live state in the tank; without it the list is a plain directory of the panel. */
  sharks?: Sharks;
  deltas?: Partial<Record<SharkId, number>>;
  speaker?: SharkId | null;
}

/** The sidebar's page-tree equivalent: one row per shark, with their interest while a pitch is running. */
/** Memoised so the sidebar skips the typewriter's per-letter re-renders of the tank. */
export const PanelList = memo(function PanelList({ sharks, deltas = NO_DELTAS, speaker = null }: Props) {
  return (
    <section aria-labelledby="panel-list-h">
      <h2 id="panel-list-h" className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        The panel
      </h2>
      <ul className="flex flex-col gap-0.5">
        {SHARK_LIST.map((shark) => {
          const state = sharks?.[shark.id];
          const out = state?.status === "out";
          return (
            <li
              key={shark.id}
              className={`rounded-md px-2 py-2 ${speaker === shark.id ? "bg-accent/10" : ""} ${out ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                <SharkFace shark={shark} mood={state ? moodFor(state.interest, state.status) : RESTING[shark.id]} size={40} animated={false} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {shark.name}
                    {out ? <span className="ml-1.5 text-xs font-semibold text-rose-300">out</span> : null}
                  </p>
                  <p className={`truncate text-xs font-medium ${shark.color.text}`}>{shark.title}</p>
                </div>
              </div>
              {state ? (
                <div className="mt-2 pl-[3.125rem]">
                  <InterestMeter name={shark.name.split(" ")[0]} value={state.interest} delta={deltas[shark.id]} barClass={shark.color.bar} compact />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
});
