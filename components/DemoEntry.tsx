"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// The recording and its script are only downloaded once the visitor opens the demo.
const DemoReplay = dynamic(() => import("./DemoReplay").then((m) => m.DemoReplay), {
  ssr: false,
  loading: () => <p className="text-slate-400">Loading the demo…</p>,
});

/** Collapsed by default: the replay is not downloaded, mounted, played or moved until the visitor opens it. */
export function DemoEntry() {
  const [open, setOpen] = useState(false);

  const tryLive = () => {
    setOpen(false);
    const field = document.getElementById("ideaName");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    field?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    field?.focus({ preventScroll: true });
  };

  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="rounded-md border border-slate-800 bg-slate-900">
      <summary className="cursor-pointer rounded-md px-5 py-3 font-semibold text-slate-100 hover:bg-slate-800">
        Watch a 60-second demo <span className="font-normal text-slate-400">(a recording, no AI call)</span>
      </summary>
      <div className="px-5 pt-2 pb-5">{open ? <DemoReplay onTryLive={tryLive} /> : null}</div>
    </details>
  );
}
