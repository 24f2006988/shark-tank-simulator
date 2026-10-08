"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dimension, SharkId } from "@/lib/types";
import { blipFor, canMumble, playBlip } from "./mumble";

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

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Plays queued lines one at a time: the text types out in the speech bubble while the shark "mumbles" one
 * blip per letter, Animal Crossing style. `skip` clears the queue so the founder can get straight to answering.
 */
export function useScript(soundOn: boolean) {
  const [queue, setQueue] = useState<Line[]>([]);
  const [shown, setShown] = useState(0);
  const nextId = useRef(1);
  const current = queue[0] ?? null;

  const play = useCallback((lines: LineInput[]) => {
    const fresh = lines.filter((l) => l.text.trim()).map((l) => ({ ...l, id: nextId.current++ }));
    if (fresh.length) setQueue((q) => [...q, ...fresh]);
  }, []);

  const skip = useCallback(() => {
    setQueue([]);
    setShown(0);
  }, []);

  useEffect(() => {
    if (!current) return;
    const { text, sharkId } = current;
    const total = text.length;
    const instant = prefersReducedMotion();
    const mumble = soundOn && canMumble() && !instant;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let n = 0;

    const advance = () => {
      setQueue((q) => q.slice(1));
      setShown(0);
    };

    const type = () => {
      n = instant ? total : Math.min(total, n + 1);
      setShown(n);
      if (mumble) {
        const blip = blipFor(sharkId, text[n - 1] ?? "", n - 1, text);
        if (blip) playBlip(blip);
      }
      // Linger a moment on the finished line so it can be read before the next shark speaks.
      timer = n >= total ? setTimeout(advance, 650) : setTimeout(type, mumble ? 42 : 24);
    };
    type();

    return () => clearTimeout(timer);
  }, [current, soundOn]);

  return { current, shown, playing: current !== null, play, skip };
}