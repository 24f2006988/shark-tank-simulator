"use client";

import { useState } from "react";
import type { Shark } from "@/lib/sharks";
import { RESTING_MOOD } from "./SharkCard";
import { SharkFace } from "./SharkFace";

/** The landing hero's picture: the four sharks, each a button that shows what they judge and who they are. */
export function PanelPicker({ sharks }: { sharks: Shark[] }) {
  const [picked, setPicked] = useState(0);
  const shark = sharks[picked];

  return (
    <div className="tank-set flex flex-col gap-4 rounded-2xl border border-slate-800 p-4 sm:p-5">
      <ul aria-label="The panel" className="grid grid-cols-4 gap-1 sm:gap-3">
        {sharks.map((s, i) => {
          const on = i === picked;
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${s.name}, ${s.title}`}
                onClick={() => setPicked(i)}
                onMouseEnter={() => setPicked(i)}
                onFocus={() => setPicked(i)}
                className="group flex w-full flex-col items-center gap-1 rounded-(--radius-control) pb-1 text-center"
              >
                <span className={`block w-full transition duration-300 ${on ? "-translate-y-1 scale-105" : "opacity-75 group-hover:opacity-100"}`}>
                  <SharkFace shark={s} mood={RESTING_MOOD[s.id]} size="100%" />
                </span>
                <span className="font-display text-sm leading-tight font-bold text-slate-100 sm:text-base">{s.name.split(" ")[0]}</span>
                <span className={`hidden text-xs font-semibold sm:block ${s.color.text}`}>{s.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" className="min-h-20 border-t border-slate-700 pt-3">
        <p className={`text-sm font-semibold ${shark.color.text}`}>
          {shark.name}, {shark.title}. Lens: {shark.lensLabel.toLowerCase()}
        </p>
        <p className="mt-1 text-pretty text-slate-200">{shark.bio}</p>
      </div>
    </div>
  );
}
