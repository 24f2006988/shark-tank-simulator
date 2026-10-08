import { DemoEntry } from "@/components/DemoEntry";
import { PanelList } from "@/components/PanelList";
import { PitchForm } from "@/components/PitchForm";
import { Shell } from "@/components/Shell";
import { SharkCard } from "@/components/SharkCard";
import { btn } from "@/components/ui";
import { SHARK_LIST } from "@/lib/sharks";

const STEPS = [
  { title: "Pitch", text: "Your idea, your ask and the equity you'll give up." },
  { title: "Get grilled", text: "Each shark probes their own lens. Dodge a question and they dig in." },
  { title: "Negotiate", text: "Sharks still in make offers. Accept, counter or walk." },
  { title: "Improve", text: "A scorecard, your weakest answer rewritten and a stronger pitch." },
];

const FACTS = ["4 AI investors", "Follow-ups on vague answers", "Offers you can counter", "A rewritten pitch"];

export default function Home() {
  return (
    <Shell crumbs={[{ label: "Shark Tank Simulator", href: "/" }, { label: "New pitch" }]} sidebar={<PanelList />}>
      <header className="hero relative overflow-hidden rounded-2xl border border-slate-800 px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-sm font-semibold tracking-wide text-accent uppercase">Practice before the real room</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight text-balance sm:text-6xl">Pitch to four AI investors</h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-slate-300">
          They ask hard, specific questions, walk out when you lose them, and send you home with a stronger pitch.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#pitch-form-h" className={`${btn.primary} text-lg`}>
            Start your pitch
          </a>
          <a href="#panel-h" className={btn.secondary}>
            Meet the panel
          </a>
        </div>
        <ul aria-label="What you get" className="mt-8 flex flex-wrap gap-2">
          {FACTS.map((f) => (
            <li key={f} className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm text-slate-200">
              {f}
            </li>
          ))}
        </ul>
      </header>

      <section aria-labelledby="how-h">
        <h2 id="how-h" className="font-display text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-accent font-semibold text-slate-950">
                {i + 1}
              </span>
              <span className="font-semibold text-slate-100">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </span>
              <span className="text-sm text-slate-300">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <DemoEntry />

      <section aria-labelledby="panel-h" className="scroll-mt-16">
        <h2 id="panel-h" className="font-display text-2xl font-semibold">
          Meet the panel
        </h2>
        <p className="mt-1 text-slate-300">Each shark covers one part of a real investment memo, so no weak spot goes unchecked.</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SHARK_LIST.map((shark) => (
            <li key={shark.id}>
              <SharkCard shark={shark} />
            </li>
          ))}
        </ul>
      </section>

      <PitchForm />
    </Shell>
  );
}
