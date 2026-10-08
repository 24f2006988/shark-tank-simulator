"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface SpeechAlternative {
  transcript: string;
  confidence?: number;
}

export interface SpeechResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternative | undefined;
}

export interface SpeechResultList {
  length: number;
  [index: number]: SpeechResult | undefined;
}

export interface SpeechEvent {
  resultIndex: number;
  results: SpeechResultList;
}

export interface SpeechErrorEvent {
  error: string;
  message?: string;
}

export interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type RecognitionCtor = new () => Recognition;

export function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};

/** True only in browsers with the Web Speech API; false during server rendering. */
export const useSpeechInputSupported = () =>
  useSyncExternalStore(noop, () => getRecognition() !== null, () => false);

export function getSpeechErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access blocked. Please allow mic permissions in your browser settings.";
    case "no-speech":
      return "No speech detected. Please check your mic and speak clearly.";
    case "audio-capture":
      return "No microphone found. Please connect an audio input device.";
    case "network":
      return "Speech service network error. Please try again or type your text.";
    case "language-not-supported":
      return "Browser speech language not supported.";
    default:
      return `Speech recognition error (${error}).`;
  }
}

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  label?: string;
  lang?: string;
}

/** Optional voice input (progressive enhancement): renders nothing where speech recognition is unavailable. */
export function MicButton({ onTranscript, disabled, label = "Speak your answer", lang }: Props) {
  const supported = useSpeechInputSupported();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rec = useRef<Recognition | null>(null);
  const interimRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  /** Stops listening for good: results still in flight are dropped, so nothing is typed in twice or later. */
  const halt = (commitInterim: boolean) => {
    const r = rec.current;
    rec.current = null;
    if (commitInterim && interimRef.current.trim()) onTranscriptRef.current(interimRef.current.trim());
    interimRef.current = "";
    setInterim("");
    setListening(false);
    if (!r) return;
    r.onresult = null;
    r.onend = null;
    r.onerror = null;
    try {
      if (commitInterim) r.stop();
      else r.abort();
    } catch {
      // already stopped
    }
  };
  const haltRef = useRef(halt);
  useEffect(() => {
    haltRef.current = halt;
  });

  // Unmount, or the router hiding the page: release the microphone and reset the button.
  useEffect(() => () => haltRef.current(false), []);

  // An answer was sent while dictating: stop, so the panel's turn is not typed into the next answer.
  useEffect(() => {
    if (disabled) haltRef.current(false);
  }, [disabled]);

  // Auto-dismiss errors after 7 seconds
  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(null), 7000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      halt(true);
      return;
    }

    setErrorMessage(null);
    setInterim("");
    interimRef.current = "";

    const Ctor = getRecognition();
    if (!Ctor) {
      setErrorMessage("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const r = new Ctor();
      const userLang = lang ?? (typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US");
      r.lang = userLang;
      r.continuous = true;
      r.interimResults = true;

      r.onresult = (e: SpeechEvent) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (!res) continue;
          const text = res[0]?.transcript ?? "";
          if (res.isFinal) {
            finalChunk += (finalChunk ? " " : "") + text.trim();
          } else {
            interimChunk += (interimChunk ? " " : "") + text.trim();
          }
        }

        if (finalChunk) {
          onTranscriptRef.current(finalChunk);
        }
        interimRef.current = interimChunk;
        setInterim(interimChunk);
      };

      r.onerror = (e: SpeechErrorEvent) => {
        if (e.error === "aborted") {
          setListening(false);
          return;
        }
        const msg = getSpeechErrorMessage(e.error);
        setErrorMessage(msg);
        setListening(false);
        setInterim("");
        interimRef.current = "";
      };

      r.onend = () => {
        if (interimRef.current.trim()) {
          onTranscriptRef.current(interimRef.current.trim());
          interimRef.current = "";
        }
        setListening(false);
        setInterim("");
      };

      rec.current = r;
      r.start();
      setListening(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to activate microphone";
      setErrorMessage(msg);
      setListening(false);
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : label}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
          listening
            ? "border-rose-400/80 bg-rose-500/20 text-rose-200 shadow-sm shadow-rose-950/50 hover:bg-rose-500/30"
            : "border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800 hover:text-white"
        }`}
      >
        {listening ? (
          <>
            <span className="relative flex size-2.5" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
            </span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 text-rose-300" fill="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
            <span>Stop listening</span>
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      <span role="status" className="sr-only">
        {listening ? "Listening to microphone" : ""}
      </span>

      {listening && interim ? (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex max-w-xs sm:max-w-md items-center gap-1.5 rounded-md border border-accent/40 bg-accent/15 px-2.5 py-1 text-xs text-accent-light"
        >
          <span className="font-semibold text-accent shrink-0">Hearing:</span>
          <span className="italic truncate">&ldquo;{interim}&rdquo;</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          aria-live="assertive"
          className="inline-flex items-center gap-2 rounded-md border border-rose-500/50 bg-rose-950/80 px-2.5 py-1 text-xs text-rose-200 shadow"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-3.5 shrink-0 text-rose-400"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="max-w-xs sm:max-w-sm">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-1 rounded text-rose-400 hover:text-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      ) : null}
    </div>
  );
}
