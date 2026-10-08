"use client";

import { useEffect, useState } from "react";
import { SHARK_IDS } from "@/lib/constants";
import { DEMO_SCRIPTS, type DemoBeat, type DemoScript } from "@/lib/demoScript";
import { SHARKS } from "@/lib/sharks";
import { InterestMeter } from "./InterestMeter";
import { SharkFace, moodFor } from "./SharkFace";
import { btn, card } from "./ui";

const MIN_BEAT_MS = 2500;
const MAX_BEAT_MS = 9000;

/** How long a line stays up: a base pause plus reading time, bounded. */
export function beatDelayMs(text: string): number {
  return Math.min(MAX_BEAT_MS, Math.max(MIN_BEAT_MS, 1800 + text.length * 30));
}

const KIND_LABEL: Record<DemoBeat["kind"], string> = {
  question: "asks",
  answer: "answers",
  reaction: "reacts",
  walkout: "is out",
  offer: "offers",
};

interface Props {
  scripts?: DemoScript[];
  /** Recording to open on; it starts playing straight away. */
  startWith?: DemoScript["id"];
  onTryLive?: () => void;
}

/** Plays back recorded sessions of the real panel. It makes no API calls and is labelled as a recording. */
export function DemoReplay({ scripts = DEMO_SCRIPTS, startWith, onTryLive }: Props) {
  const [scriptId, setScriptId] = useState(startWith ?? scripts[0].id);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(startWith !== undefined);

  const script = scripts.find((s) => s.id === scriptId) ?? scripts[0];
  const last = script.beats.length - 1;
  const beat = script.beats[Math.min(index, last)];
  const finished = index >= last;
  const running = playing && !finished;

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), beatDelayMs(beat.text));
    return () => clearTimeout(timer);
  }, [running, index, last, beat.text]);

  const choose = (id: DemoScript["id"]) => {
    setScriptId(id);
    setIndex(0);
    setPlaying(true);
  };
  const speaker = beat.sharkId ?? null;
  const speakerName = speaker ? SHARKS[speaker].name : "You (recorded founder)";

  return (
    <section aria-label="Recorded demo" className={`${card} flex flex-col gap-4 p-4 sm:p-6`}>
      <p className="self-start rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-200">Recorded demo: not live AI output</p>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose a recorded pitch">
        {scripts.map((s) => (
          <button key={s.id} type="button" aria-pressed={s.id === script.id} title={s.hint} onClick={() => choose(s.id)} className={s.id === script.id ? btn.primary : btn.secondary}>
            {s.label}
          </button>
        ))}
        <span className="text-sm text-slate-300">
          {script.pitch.ideaName}: Rs {script.pitch.askLakh} lakh for {script.pitch.equityPct}% ({script.pitch.difficulty})
        </span>
      </div>

      <ul className="grid grid-cols-4 gap-1 sm:gap-4">
        {SHARK_IDS.map((id) => {
          const shark = SHARKS[id];
          const value = beat.interests[id];
          const out = value === null;
          const interest = value ?? 0;
          const active = speaker === id;
          const delta = active && beat.delta ? beat.delta : undefined;
          return (
            <li key={id} className="relative flex flex-col items-center gap-1 text-center">
              <div aria-hidden="true" className={`seat-spot absolute inset-x-0 top-0 aspect-square transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`} />
              <div className={`relative w-full max-w-56 transition duration-500 ${active ? "scale-105" : "scale-95"} ${out ? "opacity-50 grayscale" : ""}`}>
                <SharkFace shark={shark} mood={moodFor(interest, out ? "out" : "in")} size="100%" talking={active && beat.kind !== "reaction"} reactionKey={index} delta={delta} />
                {out ? (
                  <span className="absolute top-1/3 left-1/2 -translate-x-1/2 -rotate-12 rounded border-2 border-rose-300 bg-slate-950/80 px-1.5 font-display text-xs font-extrabold tracking-widest text-rose-300 sm:text-sm">OUT</span>
                ) : null}
              </div>
              <h3 className={`font-display text-sm leading-tight font-semibold sm:text-lg ${active ? "underline decoration-2 underline-offset-4" : ""} ${shark.color.text}`}>{shark.name.split(" ")[0]}</h3>
              <div className="w-full max-w-40">
                <InterestMeter name={shark.name.split(" ")[0]} value={interest} delta={delta} barClass={shark.color.bar} compact />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="min-h-28 rounded-2xl border border-slate-800 bg-accent/10 py-4 pr-5 pl-6">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`font-semibold ${speaker ? SHARKS[speaker].color.text : "text-slate-100"}`}>{speakerName}</span>
          <span className="text-slate-300">{KIND_LABEL[beat.kind]}</span>
          {beat.followUp ? <span className="rounded-full bg-rose-300 px-2 py-0.5 text-xs font-bold text-slate-950">Follow-up</span> : null}
        </p>
        {/* Silent while it auto-advances so screen readers are not flooded; the line is announced when paused or stepped. */}
        <p aria-live={running ? "off" : "polite"} className="mt-2 text-lg leading-relaxed text-slate-100 sm:text-xl">
          {beat.text}
        </p>
      </div>

      {finished ? (
        <div className="rounded-2xl border border-slate-700 p-4">
          <h3 className="font-display text-xl font-semibold">
            {script.summary.outcome}. Debrief score: {script.summary.overall}/100
          </h3>
          <p className="mt-1 text-slate-200">{script.summary.verdict}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold text-emerald-300">Strengths</h4>
              <ul className="list-disc pl-5 text-slate-200">
                {script.summary.strengths.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-rose-300">To improve</h4>
              <ul className="list-disc pl-5 text-slate-200">
                {script.summary.weaknesses.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-slate-200">
            <span className="font-semibold">First fix:</span> {script.summary.fix}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn.secondary} onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          Back
        </button>
        <button
          type="button"
          className={btn.primary}
          onClick={() => {
            if (finished) setIndex(0);
            setPlaying(finished ? true : !running);
          }}
        >
          {finished ? "Replay" : running ? "Pause" : "Play"}
        </button>
        <button type="button" className={btn.secondary} onClick={() => setIndex((i) => Math.min(last, i + 1))} disabled={finished}>
          Next
        </button>
        <button type="button" className={btn.ghost} onClick={() => setIndex(last)} disabled={finished}>
          Skip to the result
        </button>
        <progress className="ml-auto h-2 w-32" aria-label="Demo progress" max={last} value={index} />
        <span className="text-sm text-slate-300">
          Step {index + 1} of {script.beats.length}
        </span>
        {onTryLive ? (
          <button type="button" className={btn.secondary} onClick={onTryLive}>
            Try it live
          </button>
        ) : null}
      </div>
    </section>
  );
}
