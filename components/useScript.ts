"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dimension, SharkId } from "@/lib/types";

/** One thing a shark says on stage. */
export interface Line {
  id: number;
  sharkId: SharkId;
  text: string;
  kind: "question" | "reaction" | "out" | "offer";
  followUp?: boolean;
  probing?: Dimension;
}

export type LineInput = Omit<Line, "id">;

/** Distinct delivery per shark; the voice itself is picked from what the browser offers. */
const DELIVERY: Record<SharkId, { gender: "f" | "m"; pitch: number; rate: number }> = {
  vikram: { gender: "m", pitch: 0.8, rate: 1.05 },
  meera: { gender: "f", pitch: 1.1, rate: 1 },
  arjun: { gender: "m", pitch: 1, rate: 0.95 },
  zara: { gender: "f", pitch: 1.3, rate: 1.1 },
};

const FEMALE = /female|heera|neerja|veena|zira|aria|jenny|susan|hazel|samantha|kalpana|swara|libby|sonia|natasha/i;
const MALE = /\bmale|ravi|prabhat|hemant|david|mark|guy|george|rishi|daniel|ryan|madhur|william/i;

function pickVoice(id: SharkId): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (voices.length === 0) return null;
  const want = DELIVERY[id].gender === "f" ? FEMALE : MALE;
  const local = voices.filter((v) => /en[-_]in/i.test(v.lang));
  const pool = [...local, ...voices];
  const matches = pool.filter((v) => want.test(v.name) && !(DELIVERY[id].gender === "m" && FEMALE.test(v.name)));
  // Two sharks share each gender; give the second one a different voice when there is one.
  const second = id === "arjun" || id === "zara";
  return matches[second ? 1 : 0] ?? matches[0] ?? pool[second ? 1 : 0] ?? pool[0];
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Plays queued lines one at a time: the text types out while the shark speaks it aloud, and the next line
 * starts only when both are finished. `skip` clears the queue so the founder can get straight to answering.
 */
export function useScript(voiceOn: boolean) {
  const [queue, setQueue] = useState<Line[]>([]);
  const [shown, setShown] = useState(0);
  const nextId = useRef(1);
  const current = queue[0] ?? null;

  const play = useCallback((lines: LineInput[]) => {
    const fresh = lines.filter((l) => l.text.trim()).map((l) => ({ ...l, id: nextId.current++ }));
    if (fresh.length) setQueue((q) => [...q, ...fresh]);
  }, []);

  const skip = useCallback(() => {
    if (canSpeak()) window.speechSynthesis.cancel();
    setQueue([]);
    setShown(0);
  }, []);

  // Voices load asynchronously in Chrome; touching the list early starts the load.
  useEffect(() => {
    if (canSpeak()) window.speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    if (!current) return;
    const total = current.text.length;
    const speak = voiceOn && canSpeak();
    let typed = false;
    let spoken = !speak;
    let advanced = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = () => {
      if (!typed || !spoken || advanced) return;
      advanced = true;
      timers.push(
        setTimeout(() => {
          setQueue((q) => q.slice(1));
          setShown(0);
        }, 650),
      );
    };

    const instant = prefersReducedMotion();
    let n = 0;
    const typer = setInterval(
      () => {
        n = instant ? total : Math.min(total, n + 1);
        setShown(n);
        if (n >= total) {
          clearInterval(typer);
          typed = true;
          finish();
        }
      },
      speak ? 48 : 24,
    );

    if (speak) {
      const u = new SpeechSynthesisUtterance(current.text);
      const voice = pickVoice(current.sharkId);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "en-IN";
      u.pitch = DELIVERY[current.sharkId].pitch;
      u.rate = DELIVERY[current.sharkId].rate;
      u.onend = u.onerror = () => {
        spoken = true;
        finish();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      // Some browsers never fire onend (e.g. autoplay blocked); don't let the show stall.
      timers.push(
        setTimeout(() => {
          spoken = true;
          finish();
        }, total * 95 + 2500),
      );
    }

    return () => {
      clearInterval(typer);
      timers.forEach(clearTimeout);
      if (speak) window.speechSynthesis.cancel();
    };
  }, [current, voiceOn]);

  return { current, shown, playing: current !== null, play, skip };
}
