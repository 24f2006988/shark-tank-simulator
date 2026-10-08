"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { DemoScript } from "@/lib/demoScript";
import { btn } from "./ui";

// The recording and its script are only downloaded once the visitor opens the demo.
const DemoReplay = dynamic(() => import("./DemoReplay").then((m) => m.DemoReplay), {
  ssr: false,
  loading: () => <p className="text-slate-400">Loading the demo…</p>,
});

/** Collapsed by default: the replay is not downloaded, mounted, played or moved until the visitor opens it. */
export function DemoEntry() {
  const [open, setOpen] = useState(false);
  /** Set by the shortcut button, which opens the replay on the Ruthless win and plays it. */
  const [startWith, setStartWith] = useState<DemoScript["id"] | undefined>(undefined);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const tryLive = () => {
    setOpen(false);
    const field = document.getElementById("ideaName");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    field?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    field?.focus({ preventScroll: true });
  };

  const watchRuthlessWin = () => {
    setStartWith("ruthless");
    setOpen(true);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" }));
  };

  return (
    <div className="flex flex-col gap-2">
      <details
        ref={detailsRef}
        open={open}
        onToggle={(e) => {
          setOpen(e.currentTarget.open);
          if (!e.currentTarget.open) setStartWith(undefined);
        }}
        className="rounded-2xl border border-slate-800 bg-slate-900"
      >
        <summary className="cursor-pointer rounded-2xl px-5 py-3 font-semibold text-slate-100 hover:bg-slate-800">
          Watch a recorded demo <span className="font-normal text-slate-400">(no AI call)</span>
        </summary>
        <div className="px-5 pt-2 pb-5">{open ? <DemoReplay key={startWith ?? "default"} startWith={startWith} onTryLive={tryLive} /> : null}</div>
      </details>
      <p className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <button type="button" onClick={watchRuthlessWin} className={btn.secondary}>
          Watch a win on Ruthless
        </button>
        The hardest panel, beaten: a recorded live session with 4 offers and a deal at the full ask.
      </p>
    </div>
  );
}
