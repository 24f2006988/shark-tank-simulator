import { PitchForm } from "@/components/PitchForm";
import { SharkCard } from "@/components/SharkCard";
import { SHARK_LIST } from "@/lib/sharks";

const STEPS = [
  { title: "Pitch", text: "Your idea, your ask and the equity you'll give up." },
  { title: "Get grilled", text: "Each shark probes their lens. Dodge a question and they dig in." },
  { title: "Negotiate", text: "Sharks who are still in make offers. Accept, counter or walk." },
  { title: "Improve", text: "A scorecard, your weakest answer rewritten and a better pitch." },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto w-full max-w-[1100px] px-4 pt-12 pb-6 text-center sm:pt-16">
        <p className="text-sm font-semibold tracking-[0.2em] text-amber-300 uppercase">Practice before the real room</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">Shark Tank Simulator</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-slate-300">
          Pitch your startup to four AI investors. They ask hard, specific questions, walk out when you lose them, and send you
          home with a stronger pitch.
        </p>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 px-4 pb-16">
        <section aria-labelledby="how-h">
          <h2 id="how-h" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <p className="font-display text-lg font-semibold">
                  <span className="mr-2 text-amber-300">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="mt-1 text-sm text-slate-300">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="panel-h">
          <h2 id="panel-h" className="font-display text-2xl font-semibold">
            Meet the panel
          </h2>
          <p className="mt-1 text-slate-300">Each shark covers one part of a real investment memo, so no weak spot goes unchecked.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SHARK_LIST.map((shark) => (
              <li key={shark.id}>
                <SharkCard shark={shark} />
              </li>
            ))}
          </ul>
        </section>

        <PitchForm />
      </main>
    </>
  );
}
