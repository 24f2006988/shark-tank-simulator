"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { DIFFICULTY, formatInr, impliedValuationLakh } from "@/lib/game";
import { DIFFICULTIES, LIMITS, pitchSchema } from "@/lib/schemas";
import { SHARK_IDS } from "@/lib/schemas";
import { SHARK_ARCHETYPES, resolveShark } from "@/lib/sharks";
import { SAMPLE_PITCHES } from "@/lib/samples";
import { clearPrefill, createSession, parsePrefill, readPrefillRaw, saveSession } from "@/lib/session";
import type { Difficulty, Pitch, SharkCustomization, SharkId } from "@/lib/types";
import { MicButton } from "./MicButton";
import { SharkAvatar } from "./SharkCard";
import { btn, field } from "./ui";

interface Values {
  ideaName: string;
  oneLiner: string;
  askLakh: string;
  equityPct: string;
  description: string;
  difficulty: Difficulty;
  customPanels?: Partial<Record<SharkId, SharkCustomization>>;
}

type FieldName = Exclude<keyof Values, "difficulty" | "customPanels">;

const EMPTY: Values = { ideaName: "", oneLiner: "", askLakh: "", equityPct: "", description: "", difficulty: "realistic", customPanels: undefined };

const DIFFICULTY_HINTS: Record<Difficulty, string> = {
  friendly: "Patient sharks, gentler drops in interest.",
  realistic: "Like the show: fair, but they push.",
  ruthless: "Low patience, quick walkouts, tough offers.",
};

const LABELS: Record<FieldName, string> = {
  ideaName: "Idea name",
  oneLiner: "One-liner",
  askLakh: "Ask amount (Rs lakh)",
  equityPct: "Equity offered (%)",
  description: "Your pitch",
};

const noop = () => () => {};

/** "Pitch again" from the debrief leaves the improved pitch in sessionStorage; remount the form with it. */
export function PitchForm() {
  const raw = useSyncExternalStore(noop, readPrefillRaw, () => null);
  const prefill = parsePrefill(raw);
  return <PitchFormInner key={raw ?? "empty"} prefill={prefill} />;
}

function PitchFormInner({ prefill }: { prefill: Pitch | null }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() =>
    prefill ? { ...prefill, askLakh: String(prefill.askLakh), equityPct: String(prefill.equityPct), customPanels: prefill.customPanels } : EMPTY,
  );
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(prefill ? "Your improved pitch is loaded. Review it and step back into the tank." : "");
  const summaryRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const ask = Number(values.askLakh);
  const equity = Number(values.equityPct);
  const valuation = ask > 0 && equity > 0 && equity <= 90 ? formatInr(impliedValuationLakh(ask, equity)) : null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = pitchSchema.safeParse({
      ...values,
      askLakh: values.askLakh.trim() === "" ? NaN : ask,
      equityPct: values.equityPct.trim() === "" ? NaN : equity,
    });
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        next[key] ??= values[key].trim() === "" ? `${LABELS[key]} is required` : issue.message;
      }
      setErrors(next);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSubmitting(true);
    clearPrefill();
    saveSession(createSession(parsed.data));
    router.push("/tank");
  };

  const errorList = Object.entries(errors).filter(([, m]) => m) as [FieldName, string][];
  const describe = (name: FieldName, hint?: boolean) =>
    [hint ? `${name}-hint` : null, errors[name] ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
  const fieldError = (name: FieldName) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-rose-300">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 border-t border-slate-800 pt-8" aria-labelledby="pitch-form-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="pitch-form-h" className="font-display text-2xl font-semibold">
          Step into the tank
        </h2>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Try a sample pitch">
          <span className="text-sm text-slate-300">Try a sample:</span>
          {SAMPLE_PITCHES.map((s) => (
            <button
              key={s.label}
              type="button"
              className={btn.secondary}
              title={s.hint}
              onClick={() => {
                const p = s.pitch;
                setValues({
                  ideaName: p.ideaName,
                  oneLiner: p.oneLiner ?? "",
                  askLakh: String(p.askLakh),
                  equityPct: String(p.equityPct),
                  description: p.description,
                  difficulty: p.difficulty ?? "realistic",
                });
                setErrors({});
                setNotice(`${s.label} loaded: ${s.hint.toLowerCase()}.`);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p role="status" className="text-sm text-accent-hover empty:hidden">
        {notice}
      </p>

      {errorList.length > 0 ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-summary-h" className="rounded-lg border border-rose-400 bg-rose-400/10 p-4">
          <h3 id="error-summary-h" className="font-semibold text-rose-200">
            Fix {errorList.length === 1 ? "this" : `these ${errorList.length} things`} before the sharks see it:
          </h3>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {errorList.map(([name, message]) => (
              <li key={name}>
                <a href={`#${name}`} className="underline underline-offset-2 hover:text-rose-100">
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ideaName" className="font-medium">
            {LABELS.ideaName}
          </label>
          <input
            id="ideaName"
            value={values.ideaName}
            onChange={(e) => set("ideaName", e.target.value)}
            maxLength={LIMITS.ideaName.max}
            autoComplete="off"
            required
            aria-invalid={errors.ideaName ? true : undefined}
            aria-describedby={describe("ideaName")}
            className={`${field} mt-1`}
          />
          {fieldError("ideaName")}
        </div>
        <div>
          <label htmlFor="oneLiner" className="font-medium">
            {LABELS.oneLiner} <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="oneLiner"
            value={values.oneLiner}
            onChange={(e) => set("oneLiner", e.target.value)}
            maxLength={LIMITS.oneLiner.max}
            autoComplete="off"
            aria-invalid={errors.oneLiner ? true : undefined}
            aria-describedby={describe("oneLiner")}
            className={`${field} mt-1`}
          />
          {fieldError("oneLiner")}
        </div>
        <div>
          <label htmlFor="askLakh" className="font-medium">
            {LABELS.askLakh}
          </label>
          <input
            id="askLakh"
            type="number"
            inputMode="decimal"
            min={1}
            max={10000}
            step="any"
            value={values.askLakh}
            onChange={(e) => set("askLakh", e.target.value)}
            required
            aria-invalid={errors.askLakh ? true : undefined}
            aria-describedby={describe("askLakh", true)}
            className={`${field} mt-1`}
          />
          <p id="askLakh-hint" className="mt-1 text-sm text-slate-400">
            1 lakh = Rs 1,00,000. 100 lakh = 1 crore.
          </p>
          {fieldError("askLakh")}
        </div>
        <div>
          <label htmlFor="equityPct" className="font-medium">
            {LABELS.equityPct}
          </label>
          <input
            id="equityPct"
            type="number"
            inputMode="decimal"
            min={0.5}
            max={90}
            step="any"
            value={values.equityPct}
            onChange={(e) => set("equityPct", e.target.value)}
            required
            aria-invalid={errors.equityPct ? true : undefined}
            aria-describedby={describe("equityPct", true)}
            className={`${field} mt-1`}
          />
          <p id="equityPct-hint" className="mt-1 text-sm text-slate-400" aria-live="polite">
            {valuation ? `That values your company at ${valuation}.` : "We'll show the valuation your ask implies."}
          </p>
          {fieldError("equityPct")}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="font-medium">
          {LABELS.description}
        </label>
        <textarea
          id="description"
          rows={7}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={LIMITS.description.max}
          required
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={describe("description", true)}
          className={`${field} mt-1`}
          placeholder="The problem, your solution, who pays, traction so far, and what the money is for."
        />
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
          <span id="description-hint">
            At least {LIMITS.description.min} characters. <span className="font-mono">{values.description.length}/{LIMITS.description.max}</span>
          </span>
          <MicButton label="Dictate pitch" onTranscript={(t) => set("description", (values.description ? `${values.description} ${t}` : t).slice(0, LIMITS.description.max))} />
        </div>
        {fieldError("description")}
      </div>

      <details className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition open:border-slate-600">
        <summary className="flex cursor-pointer select-none items-center justify-between font-semibold text-slate-100">
          <div className="flex items-center gap-2">
            <span>Customize Your Shark Panel</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">Optional</span>
          </div>
          <span className="text-xs text-slate-400">
            {values.customPanels && Object.keys(values.customPanels).length > 0
              ? `${Object.keys(values.customPanels).length} customized`
              : "Standard 4-shark panel"}
          </span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-slate-300">
            Pick each investor&apos;s personality archetype to test specific assumptions in your pitch:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SHARK_IDS.map((id) => {
              const shark = resolveShark(id, values.customPanels?.[id]);
              const archetypes = SHARK_ARCHETYPES[id];
              const selectedId = values.customPanels?.[id]?.archetypeId ?? archetypes[0].id;
              return (
                <div key={id} className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center gap-2.5">
                    <SharkAvatar shark={shark} size="sm" />
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-100">{shark.name}</span>
                      <span className={`block text-xs font-medium ${shark.color.text}`}>
                        {shark.title} · {shark.lensLabel}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {archetypes.map((arch) => {
                      const active = selectedId === arch.id;
                      return (
                        <button
                          key={arch.id}
                          type="button"
                          onClick={() => {
                            const next = { ...(values.customPanels ?? {}) };
                            next[id] = { archetypeId: arch.id };
                            set("customPanels", next);
                          }}
                          className={`rounded p-1.5 text-left text-xs transition border ${
                            active
                              ? "border-accent bg-accent/15 text-slate-100 font-semibold shadow-xs"
                              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <span className="block truncate">{arch.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    {archetypes.find((a) => a.id === selectedId)?.tagline}
                  </p>
                </div>
              );
            })}
          </div>
          {values.customPanels && Object.keys(values.customPanels).length > 0 ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => set("customPanels", undefined)}
                className="text-xs text-slate-400 underline hover:text-slate-200"
              >
                Reset panel to defaults
              </button>
            </div>
          ) : null}
        </div>
      </details>

      <fieldset>
        <legend className="font-medium">How tough should the panel be?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => (
            <label
              key={d}
              className="flex cursor-pointer gap-3 rounded-lg border border-slate-700 p-3 hover:border-slate-500 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-hover"
            >
              <input
                type="radio"
                name="difficulty"
                value={d}
                checked={values.difficulty === d}
                onChange={() => set("difficulty", d)}
                className="mt-1 accent-accent"
              />
              <span>
                <span className="block font-semibold">{DIFFICULTY[d].label}</span>
                <span className="block text-sm text-slate-300">{DIFFICULTY_HINTS[d]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={submitting} className={`${btn.primary} text-lg sm:self-start`}>
        {submitting ? "Opening the tank…" : "Pitch to the sharks"}
      </button>
    </form>
  );
}
