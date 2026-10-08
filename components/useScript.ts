"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dimension, SharkId } from "@/lib/types";

/** One thing a shark says on stage. */
export interface Line {
  id: number;
  sharkId: SharkId;
  text: string;
  kind: "greeting" | "question" | "reaction" | "out" | "offer";
  followUp?: boolean;
  probing?: Dimension;
}

export type LineInput = Omit<Line, "id">;

/** Distinct delivery per shark, kept in a natural range (extreme pitch or rate sounds robotic). */
const DELIVERY: Record<SharkId, { gender: "f" | "m"; pitch: number; rate: number }> = {
  vikram: { gender: "m", pitch: 0.9, rate: 1.02 },
  meera: { gender: "f", pitch: 1.05, rate: 1 },
  arjun: { gender: "m", pitch: 1, rate: 0.96 },
  zara: { gender: "f", pitch: 1.12, rate: 1.04 },
};

const FEMALE = /female|heera|neerja|veena|zira|aria|jenny|susan|hazel|samantha|kalpana|swara|libby|sonia|natasha/i;
const MALE = /male|ravi|prabhat|hemant|david|mark|guy|george|rishi|daniel|ryan|madhur|william/i;

/** Voice chosen for each shark, cached so a shark never changes voice mid-show. Cleared when the list changes. */
let voiceCache: Partial<Record<SharkId, SpeechSynthesisVoice | null>> = {};

function pickVoice(id: SharkId): SpeechSynthesisVoice | null {
  if (id in voiceCache) return voiceCache[id] ?? null;
  const english = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (english.length === 0) return null; // not loaded yet; don't cache
  // On-device voices start instantly; online ones ("Google ...") lag and stutter on weak Wi-Fi.
  const local = english.filter((v) => v.localService);
  const voices = local.length ? local : english;
  const indian = voices.filter((v) => /en[-_]in/i.test(v.lang));
  const pool = [...indian, ...voices];
  const female = DELIVERY[id].gender === "f";
  const matches = pool.filter((v) => (female ? FEMALE.test(v.name) : MALE.test(v.name) && !FEMALE.test(v.name)));
  // Two sharks share each gender; give the second one a different voice when there is one.
  const second = id === "arjun" || id === "zara";
  const unique = [...new Set(matches)];
  const voice = unique[second ? 1 : 0] ?? unique[0] ?? pool[second ? 1 : 0] ?? pool[0] ?? null;
  voiceCache[id] = voice;
  return voice;
}

/** Resolves once the browser has listed its voices (Chrome loads them asynchronously), or after a short wait. */
function voicesReady(): Promise<void> {
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", done);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", done);
    setTimeout(done, 1000);
  });
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

  // Voices load asynchronously in Chrome: touching the list starts the load, and a change resets the picks.
  useEffect(() => {
    if (!canSpeak()) return;
    const reset = () => {
      voiceCache = {};
    };
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", reset);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", reset);
  }, []);

  useEffect(() => {
    if (!current) return;
    const total = current.text.length;
    const speak = voiceOn && canSpeak();
    let typed = false;
    let spoken = !speak;
    let advanced = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let utterance: SpeechSynthesisUtterance | null = null;
    // Set on cleanup; late speech events (cancel fires onerror) must not advance the next line.
    let cancelled = false;

    const finish = () => {
      if (cancelled || !typed || !spoken || advanced) return;
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
      const synth = window.speechSynthesis;
      const start = () => {
        if (cancelled) return;
        const u = new SpeechSynthesisUtterance(current.text);
        const voice = pickVoice(current.sharkId);
        if (voice) u.voice = voice;
        u.lang = voice?.lang ?? "en-IN";
        u.pitch = DELIVERY[current.sharkId].pitch;
        u.rate = DELIVERY[current.sharkId].rate;
        u.onend = u.onerror = () => {
          utterance = null;
          spoken = true;
          finish();
        };
        utterance = u;
        synth.speak(u);
      };
      void voicesReady().then(() => {
        if (cancelled) return;
        // Chrome drops or clips speech queued right after cancel(), so only clear leftovers when there are
        // some, and give the engine a moment before speaking again.
        if (synth.speaking || synth.pending) {
          synth.cancel();
          timers.push(setTimeout(start, 120));
        } else {
          start();
        }
      });
      // Some browsers never fire onend (e.g. autoplay blocked); don't let the show stall.
      timers.push(
        setTimeout(() => {
          spoken = true;
          finish();
        }, total * 95 + 3500),
      );
    }

    return () => {
      cancelled = true;
      clearInterval(typer);
      timers.forEach(clearTimeout);
      // Only interrupt speech that is still this line's; a finished line leaves the engine alone.
      if (utterance) window.speechSynthesis.cancel();
    };
  }, [current, voiceOn]);

  return { current, shown, playing: current !== null, play, skip };
}
