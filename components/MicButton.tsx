"use client";

import { useRef, useState, useSyncExternalStore } from "react";

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};
/** True only in browsers with the Web Speech API; false during server rendering. */
export const useSpeechInputSupported = () => useSyncExternalStore(noop, () => getRecognition() !== null, () => false);

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  label?: string;
}

/** Optional voice input (progressive enhancement): renders nothing where speech recognition is unavailable. */
export function MicButton({ onTranscript, disabled, label = "Speak your answer" }: Props) {
  const supported = useSpeechInputSupported();
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results, (res) => res[0]?.transcript ?? "").join(" ").trim();
      if (text) onTranscript(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={listening}
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
          listening ? "border-rose-300 bg-rose-300/15 text-rose-200" : "border-slate-600 text-slate-200 hover:border-slate-400"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
        {listening ? "Stop listening" : label}
      </button>
      <span role="status" className="sr-only">
        {listening ? "Listening" : ""}
      </span>
    </>
  );
}
