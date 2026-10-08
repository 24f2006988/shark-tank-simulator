import { DemoEntry } from "@/components/DemoEntry";
import { PanelList } from "@/components/PanelList";
import { PitchForm } from "@/components/PitchForm";
import { Shell } from "@/components/Shell";
import { SharkCard } from "@/components/SharkCard";
import { SHARK_LIST } from "@/lib/sharks";

const STEPS = [
  { title: "Pitch", text: "your idea, your ask and the equity you'll give up." },
  { title: "Get grilled", text: "each shark probes their own lens. Dodge a question and they dig in." },
  { title: "Negotiate", text: "sharks still in make offers. Accept, counter or walk." },
  { title: "Improve", text: "a scorecard, your weakest answer rewritten and a stronger pitch." },
];

export default function Home() {
  return (
    <Shell crumbs={[{ label: "Shark Tank Simulator", href: "/" }, { label: "New pitch" }]} sidebar={<PanelList />}>
      <header>
        <p className="text-sm font-semibold text-accent">Practice before the real room</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">Pitch to four AI investors</h1>
        <p className="mt-3 max-w-2xl text-lg text-pretty text-slate-300">
          They ask hard, specific questions, walk out when you lose them, and send you home with a stronger pitch.
        </p>
      </header>

      <section aria-labelledby="how-h" className="rounded-md border border-slate-800 border-l-4 border-l-accent bg-accent/10 px-5 py-4">
        <h2 id="how-h" className="font-semibold">
          How it works
        </h2>
        <ol className="mt-2 grid gap-x-8 gap-y-1.5 text-slate-200 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="mr-1.5 font-semibold text-accent">{i + 1}.</span>
              <span className="font-semibold">{s.title}:</span> {s.text}
            </li>
          ))}
        </ol>
      </section>

      <DemoEntry />

      <section aria-labelledby="panel-h">
        <h2 id="panel-h" className="font-display text-2xl font-semibold">
          Meet the panel
        </h2>
        <p className="mt-1 text-slate-300">Each shark covers one part of a real investment memo, so no weak spot goes unchecked.</p>
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
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
