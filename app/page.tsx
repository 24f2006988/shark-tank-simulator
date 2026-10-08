import { DemoEntry } from "@/components/DemoEntry";
import { LandingPreview } from "@/components/LandingPreview";
import { PanelPicker } from "@/components/PanelPicker";
import { PitchForm } from "@/components/PitchForm";
import { Shell } from "@/components/Shell";
import { SHARK_LIST } from "@/lib/sharks";

const PAGE_LINKS = [
  { href: "#panel-h", label: "The panel" },
  { href: "#demo-h", label: "Watch a game" },
  { href: "#pitch-form-h", label: "Pitch" },
];

export default function Home() {
  return (
    <Shell
      wide
      crumbs={[{ label: "Shark Tank Simulator", href: "/" }, { label: "New pitch" }]}
      actions={
        <nav aria-label="On this page" className="mr-2 hidden items-center gap-1 lg:flex">
          {PAGE_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-(--radius-control) px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              {l.label}
            </a>
          ))}
        </nav>
      }
    >
      <header className="dot-grid -mx-4 flex flex-col items-center gap-12 px-4 pt-10 pb-6 text-center sm:-mx-8 sm:px-8 sm:pt-16">
        <div className="flex flex-col items-center">
          <h1 className="max-w-4xl font-display text-5xl leading-[1.04] font-bold tracking-tight text-balance sm:text-7xl">
            Pitch to four AI investors. <span className="text-slate-400">Before the real room.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-slate-300">
            They ask hard questions, walk out when you lose them, make offers you can counter, and send you home with a stronger pitch.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="#demo-h"
              className="inline-flex min-h-12 items-center rounded-(--radius-control) border-2 border-accent px-6 text-lg font-semibold text-slate-100 transition hover:bg-accent/10"
            >
              Watch a game
            </a>
            <a
              href="#pitch-form-h"
              className="inline-flex min-h-12 items-center rounded-(--radius-control) bg-slate-50 px-6 text-lg font-semibold text-slate-950 ring-2 ring-slate-50 ring-offset-4 ring-offset-slate-950 transition hover:bg-slate-200"
            >
              Start your pitch
            </a>
          </div>
        </div>
        <LandingPreview />
      </header>

      <section aria-labelledby="panel-h" className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 id="panel-h" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Four investors, four lenses
          </h2>
          <p className="mt-3 max-w-md text-lg text-pretty text-slate-300">
            Each shark covers one part of a real investment memo, so no weak spot goes unchecked. Pick one to see what they look for.
          </p>
        </div>
        <PanelPicker sharks={SHARK_LIST} />
      </section>

      <section aria-labelledby="demo-h" className="flex flex-col gap-4">
        <div>
          <h2 id="demo-h" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Watch a full game
          </h2>
          <p className="mt-2 max-w-2xl text-pretty text-slate-300">A real session recorded from the live app and played back here, with no AI call.</p>
        </div>
        <DemoEntry />
      </section>

      <PitchForm />
    </Shell>
  );
}
