"use client";

import { formatInr } from "@/lib/game";
import { SHARKS } from "@/lib/sharks";
import type { Deal, Debrief as DebriefData, Pitch } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { Scorecard } from "./Scorecard";
import { SharkAvatar } from "./SharkCard";
import { btn, card } from "./ui";

interface Props {
  debrief: DebriefData;
  pitch: Pitch;
  deal: Deal | null;
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

export function Debrief({ debrief: d, pitch, deal, onPitchAgain }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="verdict-h" className={`${card} flex flex-col gap-4 p-6 sm:flex-row sm:items-center`}>
        <p className="font-display text-6xl font-extrabold text-amber-300">
          <span className="sr-only">Overall score: </span>
          {d.overall}
          <span className="text-2xl text-slate-400">/100</span>
        </p>
        <div>
          <h2 id="verdict-h" className="font-display text-2xl font-semibold">
            The verdict
          </h2>
          <p className="mt-1 text-lg text-slate-100">{d.verdict}</p>
          <p className="mt-2 text-slate-300">
            {deal ? `You closed with ${SHARKS[deal.sharkId].name}: ${formatInr(deal.amountLakh)} for ${deal.equityPct}%${deal.condition ? ` (${deal.condition})` : ""}.` : "You left the tank without a deal."}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="scores-h" className={`${card} p-6`}>
          <h2 id="scores-h" className="mb-4 font-display text-xl font-semibold">
            Scorecard
          </h2>
          <Scorecard scores={d.scores} />
        </section>
        <section aria-labelledby="sw-h" className={`${card} p-6`}>
          <h2 id="sw-h" className="sr-only">
            Strengths and weaknesses
          </h2>
          <h3 className="font-display text-lg font-semibold text-emerald-300">What worked</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {d.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h3 className="mt-5 font-display text-lg font-semibold text-rose-300">What hurt you</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {d.weaknesses.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="tough-h" className={`${card} p-6`}>
        <h2 id="tough-h" className="font-display text-xl font-semibold">
          Your toughest moment, answered better
        </h2>
        <p className="mt-3 text-slate-200">
          <span className="font-semibold">Question:</span> {d.toughestMoment.question}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-rose-300/50 bg-rose-300/5 p-4">
            <h3 className="text-sm font-semibold text-rose-300">What you said</h3>
            <p className="mt-1 whitespace-pre-wrap">{d.toughestMoment.yourAnswer}</p>
          </div>
          <div className="rounded-xl border border-emerald-300/50 bg-emerald-300/5 p-4">
            <h3 className="text-sm font-semibold text-emerald-300">A stronger answer</h3>
            <p className="mt-1 whitespace-pre-wrap">{d.toughestMoment.betterAnswer}</p>
          </div>
        </div>
      </section>

      {d.sharkWishes.length > 0 ? (
        <section aria-labelledby="wish-h" className={`${card} p-6`}>
          <h2 id="wish-h" className="font-display text-xl font-semibold">
            What each shark needed to hear
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {d.sharkWishes.map((w) => (
              <li key={w.sharkId} className="flex gap-3">
                <SharkAvatar shark={SHARKS[w.sharkId]} size="sm" />
                <p>
                  <span className={`font-semibold ${SHARKS[w.sharkId].color.text}`}>{SHARKS[w.sharkId].name}:</span> {w.wanted}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="pitch-h" className="rounded-2xl border border-amber-300/60 bg-amber-300/5 p-6">
        <h2 id="pitch-h" className="font-display text-xl font-semibold text-amber-200">
          Your improved 60-second pitch
        </h2>
        <p className="mt-3 text-lg leading-relaxed whitespace-pre-wrap">{d.improvedPitch}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onPitchAgain} className={btn.primary}>
            Pitch again with this
          </button>
          <CopyButton text={d.improvedPitch} label="Copy pitch" />
          <button type="button" onClick={() => download(asText(d, pitch, deal), pitch.ideaName)} className={btn.secondary}>
            Download feedback (.txt)
          </button>
        </div>
      </section>

      <section aria-labelledby="fix-h" className={`${card} p-6`}>
        <h2 id="fix-h" className="font-display text-xl font-semibold">
          Fix these before a real meeting
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          {d.fixes.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
