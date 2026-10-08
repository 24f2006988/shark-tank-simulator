"use client";

import { useState, type KeyboardEvent, type RefObject } from "react";
import { LIMITS } from "@/lib/constants";
import { MicButton } from "./MicButton";
import { btn, field } from "./ui";

interface Props {
  sharkName: string;
  busy: boolean;
  onSubmit: (answer: string) => Promise<boolean>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function AnswerBox({ sharkName, busy, onSubmit, inputRef }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const max = LIMITS.answer.max;

  const submit = async () => {
    const answer = value.trim();
    if (!answer) {
      setError("Type an answer first. Even sharks respect a short, honest one.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    if (await onSubmit(answer)) setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!busy) void submit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="answer" className="font-semibold text-slate-100">
        Your answer to {sharkName}
      </label>
      <textarea
        id="answer"
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, max))}
        onKeyDown={onKeyDown}
        rows={3}
        maxLength={max}
        aria-describedby={`answer-hint answer-count${error ? " answer-error" : ""}`}
        aria-invalid={error ? true : undefined}
        placeholder="Be specific: numbers, names, dates."
        className={field}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
        <span id="answer-hint">Enter to send, Shift+Enter for a new line.</span>
        <span id="answer-count" aria-live="polite" className="font-mono">
          {value.length}/{max}
        </span>
      </div>
      {error ? (
        <p id="answer-error" role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={btn.primary}>
          {busy ? "The panel is listening…" : "Send answer"}
        </button>
        <MicButton disabled={busy} onTranscript={(t) => setValue((v) => (v ? `${v} ${t}` : t).slice(0, max))} />
      </div>
    </form>
  );
}
