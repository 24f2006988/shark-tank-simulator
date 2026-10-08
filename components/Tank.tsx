"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import { DIFFICULTY, MIN_ANSWERS_BEFORE_OFFERS, formatInr } from "@/lib/game";
import { answeredTurns, loadSession, saveSession, savePrefill, sessionReducer, type GameSession } from "@/lib/session";
import { SHARKS } from "@/lib/sharks";
import type { SharkId, Source, Stage, Terms } from "@/lib/types";
import { AnswerBox } from "./AnswerBox";
import { ChatLog } from "./ChatLog";
import { Debrief } from "./Debrief";
import { OfferCard } from "./OfferCard";
import { SharkPanel } from "./SharkPanel";
import { btn, card } from "./ui";

const STEPS: { stage: Stage | "pitch"; label: string }[] = [
  { stage: "pitch", label: "Pitch" },
  { stage: "questioning", label: "Questions" },
  { stage: "deal", label: "Offers" },
  { stage: "debrief", label: "Feedback" },
];

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

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
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [speak, setSpeak] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);

  const rules = DIFFICULTY[s.pitch.difficulty];
  const answered = answeredTurns(s.turns);
  const current = s.turns.at(-1);
  const awaitingAnswer = s.stage === "questioning" && !!current && !current.answer;
  const asking = awaitingAnswer ? current.sharkId : null;

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
      void run("The panel is reading your pitch…", async () => {
        const res = await api.turn({ pitch: s.pitch, sharks: s.sharks, turns: [] });
        setSource(res.source);
        if (res.data.next) dispatch({ type: "question", next: res.data.next });
      });
    } else {
      void run("Writing your feedback and a stronger pitch…", async () => {
        const res = await api.debrief({ pitch: s.pitch, sharks: s.sharks, turns: answeredTurns(s.turns), deal: s.deal });
        setSource(res.source);
        dispatch({ type: "debrief", debrief: res.data });
      });
    }
  });

  // New question: move focus to the answer box and optionally read it aloud.
  const questionCount = s.turns.length;
  useEffect(() => {
    if (!awaitingAnswer || !current) return;
    answerRef.current?.focus();
    if (speak && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${SHARKS[current.sharkId].name} asks: ${current.question}`));
    }
    // Only react to a new question arriving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionCount, awaitingAnswer]);

  // Stage change: focus the stage heading so screen readers announce where we are.
  useEffect(() => {
    if (s.stage !== "questioning") headingRef.current?.focus();
  }, [s.stage]);

  const submitAnswer = async (answer: string) => {
    setPending(answer);
    const turns = s.turns.map((t, i) => (i === s.turns.length - 1 ? { ...t, answer } : t));
    const ok = await run(
      `${SHARKS[current!.sharkId].name.split(" ")[0]} is weighing your answer…`,
      async () => {
        const res = await api.turn({ pitch: s.pitch, sharks: s.sharks, turns });
        setSource(res.source);
        dispatch({ type: "answered", answer, result: res.data });
      },
    );
    setPending(null);
    return ok;
  };

  const goToOffers = () => {
    void run(
      "The sharks are deciding whether to make offers…",
      async () => {
        const res = await api.offers({ pitch: s.pitch, sharks: s.sharks, turns: answeredTurns(s.turns) });
        setSource(res.source);
        dispatch({ type: "offers", result: res.data });
      },
    );
  };

  const counter = async (sharkId: SharkId, terms: Terms) => {
    const offer = s.offers.find((o) => o.sharkId === sharkId);
    const talk = s.talks[sharkId];
    if (!offer || !talk) return;
    await run(
      `${SHARKS[sharkId].name.split(" ")[0]} is considering your counter…`,
      async () => {
        const res = await api.negotiate({ pitch: s.pitch, offer, counter: terms, counters: talk.counters });
        setSource(res.source);
        dispatch({ type: "countered", sharkId, counter: terms, result: res.data });
      },
    );
  };

  const pitchAgain = () => {
    if (!s.debrief) return;
    savePrefill({ ...s.pitch, description: s.debrief.improvedPitch.slice(0, 2000) });
    router.push("/");
  };

  const lastReactions = answered.at(-1)?.reactions ?? [];
  const openOffers = s.offers.filter((o) => s.talks[o.sharkId]?.status === "open");
  const stepIndex = STEPS.findIndex((x) => x.stage === s.stage);

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-display text-lg font-extrabold">
            Shark Tank <span className="text-amber-300">Simulator</span>
          </Link>
          <nav aria-label="Progress">
            <ol className="flex gap-1 text-sm sm:gap-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.stage}
                  aria-current={i === stepIndex ? "step" : undefined}
                  className={`rounded-full px-2 py-1 ${i === stepIndex ? "bg-amber-300 font-semibold text-slate-950" : i < stepIndex ? "text-slate-200" : "text-slate-400"}`}
                >
                  <span className="sr-only">{i < stepIndex ? "Done: " : ""}</span>
                  {step.label}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-extrabold sm:text-3xl">
            {s.stage === "questioning" ? `Pitching ${s.pitch.ideaName}` : s.stage === "deal" ? "The offers" : "Your debrief"}
          </h1>
          <p className="text-sm text-slate-300">
            Asking {formatInr(s.pitch.askLakh)} for {s.pitch.equityPct}% · {rules.label} panel
          </p>
        </div>

        <div role="status" aria-live="polite" className="min-h-6 text-amber-200">
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-amber-300" />
              {busy}
            </span>
          ) : null}
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="lg:sticky lg:top-4 lg:self-start">
              <SharkPanel sharks={s.sharks} asking={asking} lastReactions={lastReactions} />
            </div>

            <section aria-labelledby="qa-h" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="qa-h" className="font-display text-xl font-semibold">
                  {s.over ? "Questions done" : `Question ${Math.min(answered.length + 1, rules.maxAnswers)} of ${rules.maxAnswers}`}
                </h2>
                <SpeakToggle on={speak} onChange={setSpeak} />
              </div>

              <ChatLog turns={s.turns} walkouts={s.walkouts} pendingAnswer={pending} />

              {s.over ? (
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
            </section>
          </div>
        ) : null}

        {s.stage === "deal" ? (
          <div className="flex flex-col gap-6">
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

            {s.outs.length > 0 ? (
              <section aria-labelledby="outs-h" className={`${card} p-5`}>
                <h2 id="outs-h" className="font-display text-lg font-semibold">
                  Out of the deal
                </h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {s.outs.map((o) => (
                    <li key={o.sharkId}>
                      <span className={`font-semibold ${SHARKS[o.sharkId].color.text}`}>{SHARKS[o.sharkId].name}:</span> “{o.reason}”
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

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

function SpeakToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  if (!supported) return null;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        if (on) window.speechSynthesis.cancel();
        onChange(!on);
      }}
      className={btn.ghost}
    >
      {on ? "Read questions aloud: on" : "Read questions aloud: off"}
    </button>
  );
}
