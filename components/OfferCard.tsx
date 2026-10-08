"use client";

import { useId, useState } from "react";
import { MAX_COUNTERS, formatInr, impliedValuationLakh } from "@/lib/game";
import { termsSchema } from "@/lib/schemas";
import type { Talk } from "@/lib/session";
import { SHARKS } from "@/lib/sharks";
import type { Offer, Pitch, Terms } from "@/lib/types";
import { SharkAvatar } from "./SharkCard";
import { btn, card, field } from "./ui";
import { TONE_CLASS, valuationGap } from "./verdict";

interface Props {
  offer: Offer;
  pitch: Pitch;
  talk: Talk;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCounter: (terms: Terms) => Promise<void>;
}

const STATUS_TEXT: Record<Exclude<Talk["status"], "open">, string> = {
  accepted: "Deal accepted",
  declined: "You declined this offer",
  withdrawn: "Offer withdrawn",
};

export function OfferCard({ offer, pitch, talk, busy, onAccept, onDecline, onCounter }: Props) {
  const shark = SHARKS[offer.sharkId];
  const id = useId();
  const [countering, setCountering] = useState(false);
  const [amount, setAmount] = useState(String(offer.amountLakh));
  const [equity, setEquity] = useState(String(offer.equityPct));
  const [error, setError] = useState<string | null>(null);

  const offerVal = impliedValuationLakh(offer.amountLakh, offer.equityPct);
  const askVal = impliedValuationLakh(pitch.askLakh, pitch.equityPct);
  const gap = valuationGap(offerVal, askVal);
  const open = talk.status === "open";
  const canCounter = open && talk.counters < MAX_COUNTERS;

  const submitCounter = async () => {
    const parsed = termsSchema.safeParse({ amountLakh: Number(amount), equityPct: Number(equity) });
    if (!parsed.success || !amount || !equity) {
      setError(parsed.success ? "Enter both an amount and an equity stake." : parsed.error.issues[0].message);
      return;
    }
    setError(null);
    await onCounter(parsed.data);
    setCountering(false);
  };

  return (
    <article aria-labelledby={`${id}-h`} className={`${card} relative flex flex-col gap-3 overflow-hidden p-5 ${open ? "" : "opacity-75"}`}>
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${shark.color.bar}`} />
      <header className="flex items-center gap-3">
        <SharkAvatar shark={shark} mood={talk.status === "withdrawn" ? "cold" : talk.status === "declined" ? "doubtful" : "hooked"} />
        <div>
          <h3 id={`${id}-h`} className="font-display text-lg font-semibold">
            {shark.name}
          </h3>
          <p className={`text-sm ${shark.color.text}`}>{shark.title}</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-2xl font-extrabold text-slate-50">
          {formatInr(offer.amountLakh)} <span className="text-slate-300">for</span> {offer.equityPct}%
        </p>
        <p className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[gap.tone].chip}`}>{gap.label}</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-400">Valuation implied</dt>
          <dd className="font-semibold">{formatInr(offerVal)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Your ask implied</dt>
          <dd className="font-semibold">{formatInr(askVal)}</dd>
        </div>
      </dl>
      {offer.condition ? (
        <p className="text-sm">
          <span className="font-semibold text-slate-200">Condition:</span> {offer.condition}
        </p>
      ) : null}

      <ol aria-label={`Negotiation with ${shark.name}`} className="flex flex-col gap-2 text-sm">
        {talk.log.map((entry, i) => (
          <li key={i} className={entry.from === "founder" ? "text-right text-accent-hover" : "text-slate-200"}>
            <span className="font-semibold">{entry.from === "founder" ? "You" : SHARKS[entry.from].name.split(" ")[0]}:</span>{" "}
            {entry.line ? `“${entry.line}” ` : ""}
            <span className="text-slate-400">
              ({formatInr(entry.amountLakh)} for {entry.equityPct}%)
            </span>
          </li>
        ))}
      </ol>

      {talk.status === "open" ? (
        <div className="mt-auto flex flex-col gap-3">
          {countering ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitCounter();
              }}
              className="flex flex-col gap-3 rounded-xl border border-slate-700 p-3"
              aria-label={`Counter-offer to ${shark.name}`}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor={`${id}-amt`} className="text-sm text-slate-200">
                    Amount (Rs lakh)
                  </label>
                  <input
                    id={`${id}-amt`}
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step={0.5}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-err` : undefined}
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor={`${id}-eq`} className="text-sm text-slate-200">
                    Equity (%)
                  </label>
                  <input
                    id={`${id}-eq`}
                    type="number"
                    inputMode="decimal"
                    min={0.5}
                    max={90}
                    step={0.5}
                    value={equity}
                    onChange={(e) => setEquity(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-err` : undefined}
                    className={field}
                  />
                </div>
              </div>
              {Number(amount) > 0 && Number(equity) > 0 ? (
                <p className="text-sm text-slate-300">Your counter values the company at {formatInr(impliedValuationLakh(Number(amount), Number(equity)))}.</p>
              ) : null}
              {error ? (
                <p id={`${id}-err`} role="alert" className="text-sm text-rose-300">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy} className={btn.primary}>
                  {busy ? "Waiting for reply…" : "Send counter"}
                </button>
                <button type="button" onClick={() => setCountering(false)} className={btn.ghost}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onAccept} disabled={busy} className={btn.primary}>
              Accept deal
            </button>
            {canCounter && !countering ? (
              <button
                type="button"
                onClick={() => {
                  setAmount(String(offer.amountLakh));
                  setEquity(String(offer.equityPct));
                  setCountering(true);
                }}
                disabled={busy}
                className={btn.secondary}
              >
                Counter
              </button>
            ) : null}
            <button type="button" onClick={onDecline} disabled={busy} className={btn.ghost}>
              Decline
            </button>
          </div>
          {!canCounter ? <p className="text-sm text-slate-400">Final offer: no more counters.</p> : null}
        </div>
      ) : (
        <p className="mt-auto font-semibold text-slate-200">{STATUS_TEXT[talk.status as keyof typeof STATUS_TEXT]}</p>
      )}
    </article>
  );
}
