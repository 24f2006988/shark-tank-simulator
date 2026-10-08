"use client";

import dynamic from "next/dynamic";

/** The game lives in sessionStorage, so it renders only in the browser. */
const Tank = dynamic(() => import("@/components/Tank"), {
  ssr: false,
  loading: () => (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-20">
      <p role="status" className="text-slate-300">
        Opening the tank…
      </p>
    </main>
  ),
});

export function TankLoader() {
  return <Tank />;
}
