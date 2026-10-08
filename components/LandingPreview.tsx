"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { SHARKS, SHARK_LIST } from "@/lib/sharks";
import type { SharkId } from "@/lib/types";
import { InterestMeter } from "./InterestMeter";
import { RESTING_MOOD } from "./SharkCard";
import { SharkFace, type Mood } from "./SharkFace";

/**
 * Lines from one real game on the live app (WashMate, Realistic panel, 9 Oct 2026), shown as a framed preview under the
 * landing headline. Four tabs walk the four steps; the panel sits on the frame's top edge and reacts to each step.
 */
interface Step {
  id: string;
  label: string;
  /** Who is in focus on the frame's edge for this step, and how each shark looks. */
  focus: SharkId[];
  moods: Partial<Record<SharkId, Mood>>;
}

const STEPS: Step[] = [
  { id: "pitch", label: "Pitch", focus: [], moods: {} },
  { id: "grilled", label: "Get grilled", focus: ["meera"], moods: { vikram: "neutral", meera: "doubtful", arjun: "neutral", zara: "doubtful" } },
  { id: "negotiate", label: "Negotiate", focus: ["vikram", "zara"], moods: { vikram: "neutral", meera: "warm", arjun: "neutral", zara: "hooked" } },
  { id: "improve", label: "Improve", focus: ["zara"], moods: { vikram: "neutral", meera: "warm", arjun: "neutral", zara: "hooked" } },
];

const ROTATE_MS = 7000;

function PitchPanel() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-400">WashMate · asking Rs 25 lakh for 10% · Realistic panel</p>
      <p className="text-lg text-pretty text-slate-100">
        Hostel students waste 3 to 4 hours a week on laundry. WashMate picks up a bag from your room and returns it in 24 hours for Rs 149. A
        six-week pilot at Pondicherry University: 140 sign-ups, 62 repeat users.
      </p>
      <p className="text-sm text-slate-300">That values the company at Rs 2.5 crore.</p>
    </div>
  );
}

function GrilledPanel() {
  const meters: [SharkId, number, number][] = [
    ["vikram", 50, -5],
    ["meera", 35, -15],
    ["arjun", 50, 0],
    ["zara", 44, -6],
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        You said: “Word of mouth mostly, students love it.” Rated Weak (1/5) · the panel found it vague
      </p>
      <div className="rounded-2xl border border-slate-800 bg-accent/10 px-5 py-4">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`font-semibold ${SHARKS.meera.color.text}`}>Meera Iyer</span>
          <span className="rounded-full bg-rose-300 px-2 py-0.5 text-xs font-bold text-slate-950">Follow-up</span>
        </p>
        <p className="mt-2 text-lg text-pretty text-slate-100">
          You said word of mouth will drive growth. Exactly which student groups or WhatsApp communities on the new campuses are you partnering
          with on day one?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {meters.map(([id, value, delta]) => (
          <div key={id}>
            <p className={`text-xs font-semibold ${SHARKS[id].color.text}`}>{SHARKS[id].name.split(" ")[0]}</p>
            <InterestMeter name={SHARKS[id].name.split(" ")[0]} value={value} delta={delta} barClass={SHARKS[id].color.bar} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

function NegotiatePanel() {
  const offers: [SharkId, string, string, string][] = [
    ["vikram", "Rs 25 lakh for 12%", "17% below your valuation", "Rs 10 royalty per bag until capital is returned"],
    ["zara", "Rs 25 lakh for 10%", "Matches your valuation", "Monthly advisory meetings on campus expansion"],
  ];
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-2">
        {offers.map(([id, terms, gap, condition]) => (
          <li key={id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className={`text-sm font-semibold ${SHARKS[id].color.text}`}>{SHARKS[id].name}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{terms}</p>
            <p className="text-sm text-slate-400">{gap}</p>
            <p className="mt-2 text-sm text-slate-200">Condition: {condition}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-300">
        You countered Vikram at 10%. <span className={SHARKS.vikram.color.text}>Vikram:</span> “My terms stand. I don&apos;t fund stubbornness
        without better unit economics.” He withdrew.
      </p>
    </div>
  );
}

function ImprovePanel() {
  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
      <p className="font-display text-6xl leading-none font-extrabold tracking-tight">
        64<span className="text-xl text-slate-400">/100</span>
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-accent-hover">Promising, with gaps · deal with Zara Khan</p>
        <p className="text-sm text-slate-400">Your weakest answer, rewritten:</p>
        <p className="text-lg text-pretty text-slate-100">
          “We skip paid ads by partnering with hostel mess committees on day one, offering a Rs 10 credit per bag for their events fund.”
        </p>
        <p className="text-sm text-slate-300">Plus a scorecard, what each shark needed to hear, and a rewritten 60-second pitch.</p>
      </div>
    </div>
  );
}

const PANELS: Record<string, () => React.JSX.Element> = { pitch: PitchPanel, grilled: GrilledPanel, negotiate: NegotiatePanel, improve: ImprovePanel };

export function LandingPreview() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = STEPS[index];
  const Panel = PANELS[step.id];

  // Walks the steps on its own until the visitor picks one; never under reduced motion.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % STEPS.length), ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [index, paused]);

  const pick = (i: number) => {
    setPaused(true);
    setIndex(i);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const move = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const next = (index + move + STEPS.length) % STEPS.length;
    pick(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div role="tablist" aria-label="How a game goes" onKeyDown={onKey} className="flex flex-wrap justify-center gap-1">
        {STEPS.map((s, i) => {
          const on = i === index;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`preview-tab-${s.id}`}
              aria-selected={on}
              aria-controls="preview-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => pick(i)}
              className={`flex min-h-11 items-center gap-2 border-b-2 px-4 font-mono text-sm tracking-widest uppercase transition ${on ? "border-accent text-slate-50" : "border-slate-800 text-slate-400 hover:text-slate-200"}`}
            >
              <span aria-hidden="true" className={`size-2.5 ${on ? "bg-accent" : "bg-slate-600"}`} />
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative w-full max-w-4xl pt-16 text-left sm:pt-28">
        {/* The panel peeks over the frame, each with a name tag. */}
        <ul aria-hidden="true" className="absolute inset-x-0 top-0 z-10 flex h-16 items-end justify-center gap-2 sm:h-28 sm:gap-6">
          {SHARK_LIST.map((shark) => {
            const on = step.focus.includes(shark.id);
            const dim = step.focus.length > 0 && !on;
            return (
              <li key={shark.id} className={`relative flex flex-col items-center transition duration-500 ${on ? "-translate-y-2" : ""} ${dim ? "opacity-60" : ""}`}>
                <span className={`absolute -top-2 left-[70%] z-10 rounded-sm px-1.5 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap text-slate-950 ${shark.color.bar}`}>
                  {shark.name.split(" ")[0]}
                </span>
                <div className="-mb-px w-16 sm:w-28">
                  <SharkFace shark={shark} mood={step.moods[shark.id] ?? RESTING_MOOD[shark.id]} size="100%" talking={on && step.id === "grilled"} />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="relative rounded-2xl border border-slate-700 bg-slate-900 shadow-[var(--shadow)]">
          {/* Corner marks, like a canvas frame. */}
          {["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((pos) => (
            <span key={pos} aria-hidden="true" className={`absolute ${pos} size-2 bg-slate-500`} />
          ))}
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Pitching WashMate</span>
            <span aria-hidden="true">·</span>
            <span>a real game, recorded on the live app</span>
          </div>
          <div id="preview-panel" role="tabpanel" aria-labelledby={`preview-tab-${step.id}`} className="min-h-72 p-5 sm:p-8">
            <Panel key={step.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
