"use client";

import type { ReactNode } from "react";
import { activeSharks, formatInr } from "@/lib/game";
import { SHARKS, SHARK_LIST } from "@/lib/sharks";
import type { Deal, Debrief as DebriefData, Pitch, Sharks, Turn } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { InterestChart } from "./InterestChart";
import { Tile, kicker } from "./Readout";
import { ResultCard } from "./ResultCard";
import { Scorecard } from "./Scorecard";
import { SharkAvatar } from "./SharkCard";
import { btn } from "./ui";
import { TONE_CLASS, scoreBand } from "./verdict";

interface Props {
  debrief: DebriefData;
  pitch: Pitch;
  deal: Deal | null;
  /** How many sharks made an offer, for the result card. */
  offerCount?: number;
  /** The answered turns and the panel's final state, for the interest trace; without turns it is left out. */
  turns?: Turn[];
  sharks?: Sharks;
  onPitchAgain: () => void;
}

function asText(d: DebriefData, pitch: Pitch, deal: Deal | null): string {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  return [
    `Shark Tank Simulator: feedback for ${pitch.ideaName}`,
    `Overall: ${d.overall}/100. ${d.verdict}`,
    deal ? `Deal: ${SHARKS[deal.sharkId].name}, ${formatInr(deal.amountLakh)} for ${deal.equityPct}%` : "Deal: none",
    `\nStrengths:\n${list(d.strengths)}`,
    `\nWeaknesses:\n${list(d.weaknesses)}`,
    `\nToughest question: ${d.toughestMoment.question}\nYour answer: ${d.toughestMoment.yourAnswer}\nBetter answer: ${d.toughestMoment.betterAnswer}`,
    `\nImproved pitch:\n${d.improvedPitch}`,
    `\nFix before your next pitch:\n${list(d.fixes)}`,
  ].join("\n");
}

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "pitch"}-feedback.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/** The overall score as a ring that fills to the score, coloured by its band. */
function ScoreRing({ overall }: { overall: number }) {
  const r = 42;
  const length = 2 * Math.PI * r;
  const tone = TONE_CLASS[scoreBand(overall).tone];
  return (
    <div className="relative grid size-32 shrink-0 place-items-center">
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-slate-800" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - Math.min(100, Math.max(0, overall)) / 100)}
          className={`${tone.stroke} transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <p className={`font-display text-4xl font-extrabold ${tone.text}`}>
        <span className="sr-only">Overall score: </span>
        {overall}
        <span className="text-base text-slate-400">/100</span>
      </p>
    </div>
  );
}

const CORNERS = ["-top-1 -left-1", "-top-1 -right-1", "-bottom-1 -left-1", "-bottom-1 -right-1"];

/** One cell of the results grid: a mono kicker, a heading that names the region, then its content. */
function Cell({ id, label, title, wide = false, children }: { id: string; label: string; title: string; wide?: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`flex flex-col gap-4 bg-slate-950 p-5 sm:p-6 ${wide ? "lg:col-span-2" : ""}`}>
      <div>
        <p className={`${kicker} text-accent-hover`}>{label}</p>
        <h2 id={id} className="mt-1 font-display text-xl font-bold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function Debrief({ debrief: d, pitch, deal, offerCount = 0, turns = [], sharks, onPitchAgain }: Props) {
  const band = scoreBand(d.overall);
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="verdict-h" className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 id="verdict-h" className={`${kicker} inline-block border-b-2 border-accent pb-1 font-semibold text-accent-hover`}>
            The verdict
          </h2>
          <p className="mt-4 max-w-3xl font-display text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">{d.verdict}</p>
          <p className="mt-3 text-slate-300">
            {deal ? `You closed with ${SHARKS[deal.sharkId].name}: ${formatInr(deal.amountLakh)} for ${deal.equityPct}%${deal.condition ? ` (${deal.condition})` : ""}.` : "You left the tank without a deal."}
          </p>
          <ResultCard debrief={d} pitch={pitch} deal={deal} offerCount={offerCount} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <ScoreRing overall={d.overall} />
          <p className={`text-sm font-semibold ${TONE_CLASS[band.tone].text}`}>{band.label}</p>
        </div>
      </section>

      <div className="relative">
        {CORNERS.map((pos) => (
          <span key={pos} aria-hidden="true" className={`absolute ${pos} z-10 size-2 bg-slate-500`} />
        ))}
        <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 lg:grid-cols-2">
          {turns.length > 0 ? (
            <Cell id="trace-h" label="Interest trace" title="How the panel moved" wide>
              <InterestChart turns={turns} difficulty={pitch.difficulty} />
              <ul aria-label="Chart legend" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {SHARK_LIST.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span aria-hidden="true" className={`h-1 w-5 rounded-full ${s.color.bar}`} />
                    {s.name}
                  </li>
                ))}
              </ul>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Tile label="Answers">{turns.length}</Tile>
                {sharks ? <Tile label="Still in">{activeSharks(sharks).length} of 4</Tile> : null}
                <Tile label="Offers">{offerCount}</Tile>
                <Tile label="Deal" tone={deal ? "text-emerald-300" : "text-slate-300"}>
                  {deal ? `${deal.equityPct}%` : "None"}
                </Tile>
              </dl>
            </Cell>
          ) : null}

          <Cell id="scores-h" label="Out of 10" title="Scorecard">
            <Scorecard scores={d.scores} />
          </Cell>

          <Cell id="sw-h" label="Strengths and weaknesses" title="What worked, what hurt">
            <div>
              <h3 className="text-sm font-semibold text-emerald-300">What worked</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {d.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-300">What hurt you</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {d.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </Cell>

          <Cell id="tough-h" label="Weakest answer" title="Your toughest moment, answered better">
            <p className="text-slate-200">
              <span className="font-semibold">Question:</span> {d.toughestMoment.question}
            </p>
            <div className="rounded-(--radius-control) border border-rose-300/40 p-3">
              <h3 className={`${kicker} text-rose-300`}>What you said</h3>
              <p className="mt-1 whitespace-pre-wrap">{d.toughestMoment.yourAnswer}</p>
            </div>
            <div className="rounded-(--radius-control) border border-emerald-300/40 p-3">
              <h3 className={`${kicker} text-emerald-300`}>A stronger answer</h3>
              <p className="mt-1 whitespace-pre-wrap">{d.toughestMoment.betterAnswer}</p>
            </div>
          </Cell>

          {d.sharkWishes.length > 0 ? (
            <Cell id="wish-h" label="Per shark" title="What each shark needed to hear">
              <ul className="flex flex-col gap-3">
                {d.sharkWishes.map((w) => (
                  <li key={w.sharkId} className="flex gap-3">
                    <SharkAvatar shark={SHARKS[w.sharkId]} size="sm" />
                    <p>
                      <span className={`font-semibold ${SHARKS[w.sharkId].color.text}`}>{SHARKS[w.sharkId].name}:</span> {w.wanted}
                    </p>
                  </li>
                ))}
              </ul>
            </Cell>
          ) : null}
        </div>
      </div>

      <section aria-labelledby="pitch-h" className="rounded-2xl border border-accent/60 bg-accent/5 p-6">
        <p className={`${kicker} text-accent-hover`}>Take this into the real room</p>
        <h2 id="pitch-h" className="mt-1 font-display text-2xl font-bold">
          Your improved 60-second pitch
        </h2>
        <p className="mt-3 text-lg leading-relaxed whitespace-pre-wrap">{d.improvedPitch}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={onPitchAgain} className={btn.primary}>
            Pitch again with this
          </button>
          <CopyButton text={d.improvedPitch} label="Copy pitch" />
          <button
            type="button"
            onClick={() => download(asText(d, pitch, deal), pitch.ideaName)}
            className="inline-flex min-h-11 items-center gap-1.5 px-2 font-mono text-sm font-semibold tracking-wider text-accent-hover uppercase underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">[</span>
            Download feedback (.txt)
            <span aria-hidden="true">]</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="fix-h">
        <h2 id="fix-h" className="font-display text-2xl font-bold">
          Fix these before a real meeting
        </h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {d.fixes.map((f, i) => (
            <li key={f} className="rounded-2xl border border-slate-800 p-4">
              <p aria-hidden="true" className={`${kicker} text-slate-400`}>
                Fix {i + 1}
              </p>
              <p className="mt-1">{f}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
