"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { DIFFICULTY, MIN_ANSWERS_BEFORE_OFFERS, formatInr } from "@/lib/game";
import { answeredTurns, loadSession, saveSession, savePrefill, sessionReducer, type GameSession } from "@/lib/session";
import { SHARKS } from "@/lib/sharks";
import type { OffersResult, Question, SharkId, Source, Stage, Terms, TurnResult } from "@/lib/types";
import { AnswerBox } from "./AnswerBox";
import { ChatLog } from "./ChatLog";
import { Debrief } from "./Debrief";
import { greetingScript } from "./greeting";
import { OfferCard } from "./OfferCard";
import { Stage as PanelStage } from "./Stage";
import { canMumble } from "./mumble";
import { useScript, type LineInput } from "./useScript";
import { btn, card } from "./ui";

const STEPS: { stage: Stage | "pitch"; label: string }[] = [
  { stage: "pitch", label: "Pitch" },
  { stage: "questioning", label: "Questions" },
  { stage: "deal", label: "Offers" },
  { stage: "debrief", label: "Feedback" },
];

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

const questionLine = (q: Question): LineInput => ({
  sharkId: q.sharkId,
  text: q.question,
  kind: "question",
  followUp: q.isFollowUp,
  probing: q.probing,
});

/**
 * After an answer the panel performs in order: the asker reacts, the most moved other shark chips in,
 * anyone leaving says why, then the next question. Short and sequential, so nothing floods the screen.
 */
export function reactionScript(result: TurnResult, askerId: SharkId): LineInput[] {
  const reactions = result.evaluation?.reactions ?? [];
  const walkouts = result.evaluation?.walkouts ?? [];
  const leaving = new Set(walkouts.map((w) => w.sharkId));
  const lines: LineInput[] = [];
  const asker = reactions.find((r) => r.sharkId === askerId);
  if (asker?.line && !leaving.has(askerId)) lines.push({ sharkId: askerId, text: asker.line, kind: "reaction" });
  const loudest = reactions
    .filter((r) => r.sharkId !== askerId && r.line && !leaving.has(r.sharkId) && Math.abs(r.delta) >= 8)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  if (loudest) lines.push({ sharkId: loudest.sharkId, text: loudest.line, kind: "reaction" });
  for (const w of walkouts) lines.push({ sharkId: w.sharkId, text: w.reason, kind: "out" });
  if (result.next) lines.push(questionLine(result.next));
  return lines;
}

/** Each offer is announced by its shark; sharks who were still in but pass say why. */
export function offerScript(result: OffersResult, sharks: GameSession["sharks"]): LineInput[] {
  return [
    ...result.offers.map(
      (o): LineInput => ({ sharkId: o.sharkId, text: `${o.line} ${formatInr(o.amountLakh)} for ${o.equityPct} percent.`.trim(), kind: "offer" }),
    ),
    ...result.outs
      .filter((o) => sharks[o.sharkId].status === "in")
      .map((o): LineInput => ({ sharkId: o.sharkId, text: o.reason, kind: "out" })),
  ];
}

export default function Tank() {
  const [stored] = useState(loadSession);
  if (!stored) return <NoSession />;
  return <TankGame initial={stored} />;
}

function NoSession() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold">The tank is empty</h1>
      <p className="text-slate-300">There is no pitch in progress. Start one and the sharks will be waiting.</p>
      <Link href="/" className={btn.primary}>
        Write a pitch
      </Link>
    </main>
  );
}

function TankGame({ initial }: { initial: GameSession }) {
  const router = useRouter();
  const [s, dispatch] = useReducer(sessionReducer, initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [thinking, setThinking] = useState<SharkId | null>(null);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const script = useScript(voiceOn);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);

  const rules = DIFFICULTY[s.pitch.difficulty];
  const answered = answeredTurns(s.turns);
  const current = s.turns.at(-1);
  const awaitingAnswer = s.stage === "questioning" && !!current && !current.answer;

  useEffect(() => saveSession(s), [s]);

  /** Runs one API call with a busy message and an error banner whose retry repeats the same task. */
  async function run(message: string, task: () => Promise<void>): Promise<boolean> {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(message);
    setError(null);
    try {
      await task();
      return true;
    } catch (e) {
      setError({ message: errorText(e), retry: () => void run(message, task) });
      return false;
    } finally {
      inFlight.current = false;
      setBusy(null);
      setThinking(null);
    }
  }

  // Kick off whatever the current stage still needs (also covers a reload mid-request). Once per need;
  // failures are retried from the error banner, never in a loop.
  const kicked = useRef<string | null>(null);
  useEffect(() => {
    const need = s.stage === "questioning" && s.turns.length === 0 ? "opening" : s.stage === "debrief" && !s.debrief ? "debrief" : null;
    if (!need || kicked.current === need) return;
    kicked.current = need;
    if (need === "opening") {
      // The panel greets while the first question is being written.
      script.play(greetingScript(s.pitch));
      void run("The panel is reading your pitch…", async () => {
        const res = await api.turn({ pitch: s.pitch, sharks: s.sharks, turns: [] });
        setSource(res.source);
        if (!res.data.next) return;
        dispatch({ type: "question", next: res.data.next });
        script.play([questionLine(res.data.next)]);
      });
    } else {
      void run("Writing your feedback and a stronger pitch…", async () => {
        const res = await api.debrief({ pitch: s.pitch, sharks: s.sharks, turns: answeredTurns(s.turns), deal: s.deal });
        setSource(res.source);
        dispatch({ type: "debrief", debrief: res.data });
      });
    }
  });

  // Once the panel has finished speaking, hand the floor to the founder.
  useEffect(() => {
    if (awaitingAnswer && !script.playing) answerRef.current?.focus();
  }, [awaitingAnswer, script.playing]);

  // Stage change: focus the stage heading so screen readers announce where we are.
  useEffect(() => {
    if (s.stage !== "questioning") headingRef.current?.focus();
  }, [s.stage]);

  const submitAnswer = async (answer: string) => {
    if (!current) return false;
    script.skip();
    setThinking(current.sharkId);
    const turns = s.turns.map((t, i) => (i === s.turns.length - 1 ? { ...t, answer } : t));
    return run(`${SHARKS[current.sharkId].name.split(" ")[0]} is weighing your answer…`, async () => {
      const res = await api.turn({ pitch: s.pitch, sharks: s.sharks, turns });
      setSource(res.source);
      dispatch({ type: "answered", answer, result: res.data });
      script.play(reactionScript(res.data, current.sharkId));
    });
  };

  const goToOffers = () => {
    script.skip();
    void run("The sharks are deciding whether to make offers…", async () => {
      const res = await api.offers({ pitch: s.pitch, sharks: s.sharks, turns: answeredTurns(s.turns) });
      setSource(res.source);
      dispatch({ type: "offers", result: res.data });
      script.play(offerScript(res.data, s.sharks));
    });
  };

  const counter = async (sharkId: SharkId, terms: Terms) => {
    const offer = s.offers.find((o) => o.sharkId === sharkId);
    const talk = s.talks[sharkId];
    if (!offer || !talk) return;
    script.skip();
    setThinking(sharkId);
    await run(`${SHARKS[sharkId].name.split(" ")[0]} is considering your counter…`, async () => {
      const res = await api.negotiate({ pitch: s.pitch, offer, counter: terms, counters: talk.counters });
      setSource(res.source);
      dispatch({ type: "countered", sharkId, counter: terms, result: res.data });
      const proposal = res.data.response === "counter" ? ` ${formatInr(res.data.amountLakh)} for ${res.data.equityPct} percent.` : "";
      script.play([{ sharkId, text: `${res.data.line}${proposal}`, kind: res.data.response === "walk" ? "out" : "offer" }]);
    });
  };

  const pitchAgain = () => {
    if (!s.debrief) return;
    savePrefill({ ...s.pitch, description: s.debrief.improvedPitch.slice(0, 2000) });
    router.push("/");
  };

  const lastReactions = answered.at(-1)?.reactions ?? [];
  const deltas = Object.fromEntries(lastReactions.map((r) => [r.sharkId, r.delta]));
  const openOffers = s.offers.filter((o) => s.talks[o.sharkId]?.status === "open");
  const stepIndex = STEPS.findIndex((x) => x.stage === s.stage);
  const stage = (
    <PanelStage
      sharks={s.sharks}
      line={script.current}
      shown={script.shown}
      idle={awaitingAnswer ? questionLine(current) : null}
      thinking={thinking}
      deltas={s.stage === "questioning" ? deltas : {}}
      round={answered.length}
      onSkip={script.skip}
    />
  );

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-display text-lg font-extrabold">
            Shark Tank <span className="text-accent">Simulator</span>
          </Link>
          <nav aria-label="Progress">
            <ol className="flex gap-1 text-sm sm:gap-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.stage}
                  aria-current={i === stepIndex ? "step" : undefined}
                  className={`rounded-full px-2 py-1 ${i === stepIndex ? "bg-accent font-semibold text-slate-950" : i < stepIndex ? "text-slate-200" : "text-slate-400"}`}
                >
                  <span className="sr-only">{i < stepIndex ? "Done: " : ""}</span>
                  {step.label}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-4 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-extrabold sm:text-3xl">
            {s.stage === "questioning" ? `Pitching ${s.pitch.ideaName}` : s.stage === "deal" ? "The offers" : "Your debrief"}
          </h1>
          <p className="text-sm text-slate-300">
            Asking {formatInr(s.pitch.askLakh)} for {s.pitch.equityPct}% · {rules.label} panel
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="status" aria-live="polite" className="min-h-6 text-accent-hover">
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-accent" />
                {busy}
              </span>
            ) : s.stage === "questioning" ? (
              <span className="text-slate-300">
                {s.over ? "Questions done" : `Question ${Math.min(answered.length + 1, rules.maxAnswers)} of ${rules.maxAnswers}`}
              </span>
            ) : null}
          </div>
          {s.stage !== "debrief" ? <VoiceToggle on={voiceOn} onChange={setVoiceOn} /> : null}
        </div>

        {error ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-400 bg-rose-400/10 p-4">
            <p>{error.message}</p>
            <button type="button" onClick={error.retry} className={btn.secondary}>
              Try again
            </button>
          </div>
        ) : null}

        {s.stage === "questioning" ? (
          <div className="flex flex-col gap-5">
            {stage}

            {s.over && !script.playing ? (
              <div className={`${card} flex flex-col gap-3 p-5`}>
                <p className="font-semibold">The panel has heard enough. Time to see who wants in.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={goToOffers} disabled={!!busy} className={btn.primary}>
                    Hear the offers
                  </button>
                </div>
              </div>
            ) : awaitingAnswer ? (
              <AnswerBox sharkName={SHARKS[current.sharkId].name} busy={!!busy} onSubmit={submitAnswer} inputRef={answerRef} />
            ) : null}

            {!s.over ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={goToOffers}
                  disabled={!!busy || answered.length < MIN_ANSWERS_BEFORE_OFFERS}
                  aria-describedby="offers-hint"
                  className={btn.secondary}
                >
                  Go to offers
                </button>
                <button type="button" onClick={() => dispatch({ type: "toDebrief" })} disabled={!!busy || answered.length < 1} className={btn.ghost}>
                  End and get feedback
                </button>
                <p id="offers-hint" className="w-full text-sm text-slate-400">
                  {answered.length < MIN_ANSWERS_BEFORE_OFFERS
                    ? `Offers open after ${MIN_ANSWERS_BEFORE_OFFERS} answers (${answered.length} so far).`
                    : "You can ask for offers now, or keep answering to win more sharks over."}
                </p>
              </div>
            ) : null}

            {answered.length > 0 ? (
              <details className={`${card} p-4`}>
                <summary className="min-h-6 cursor-pointer font-semibold text-slate-200">Transcript ({answered.length} answered)</summary>
                <div className="mt-4">
                  <ChatLog turns={s.turns} walkouts={s.walkouts} />
                </div>
              </details>
            ) : null}
          </div>
        ) : null}

        {s.stage === "deal" ? (
          <div className="flex flex-col gap-6">
            {stage}

            {s.offers.length > 0 ? (
              <section aria-labelledby="offers-h">
                <h2 id="offers-h" className="sr-only">
                  Offers on the table
                </h2>
                <ul className="grid gap-4 md:grid-cols-2">
                  {s.offers.map((o) => (
                    <li key={o.sharkId}>
                      <OfferCard
                        offer={o}
                        pitch={s.pitch}
                        talk={s.talks[o.sharkId]!}
                        busy={!!busy}
                        onAccept={() => dispatch({ type: "accept", sharkId: o.sharkId })}
                        onDecline={() => dispatch({ type: "decline", sharkId: o.sharkId })}
                        onCounter={(t) => counter(o.sharkId, t)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className={`${card} p-5 text-lg`}>No shark made an offer this time. The feedback will show you exactly why.</p>
            )}

            <div>
              <button type="button" onClick={() => dispatch({ type: "toDebrief" })} disabled={!!busy} className={openOffers.length ? btn.secondary : btn.primary}>
                {openOffers.length ? "Walk away with no deal" : "Get my feedback"}
              </button>
            </div>
          </div>
        ) : null}

        {s.stage === "debrief" && s.debrief ? <Debrief debrief={s.debrief} pitch={s.pitch} deal={s.deal} onPitchAgain={pitchAgain} /> : null}

        {source === "fallback" ? (
          <p className="text-xs text-slate-400">The AI panel is busy, so the last reply came from scripted backup sharks.</p>
        ) : null}
      </main>
    </>
  );
}

function VoiceToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  if (!canMumble()) return null;
  return (
    <button type="button" aria-pressed={on} onClick={() => onChange(!on)} className={btn.ghost}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 6 6M22 9l-6 6" />}
      </svg>
      {on ? "Sound on" : "Sound off"}
    </button>
  );
}
