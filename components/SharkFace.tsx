"use client";

import { useEffect, useRef } from "react";
import type { Shark } from "@/lib/sharks";
import type { SharkId } from "@/lib/types";
import { Pixels } from "./pixel/Pixels";
import { SIZE, buildBase, buildFeatures, type PixelMood } from "./pixel/sprites";

export type Mood = PixelMood;

/** Expression from interest, using the same bands as the meter's words. */
export function moodFor(interest: number, status: "in" | "out" = "in"): Mood {
  if (status === "out") return "out";
  if (interest >= 80) return "hooked";
  if (interest >= 60) return "warm";
  if (interest >= 40) return "neutral";
  if (interest >= 20) return "doubtful";
  return "cold";
}

/** Staggered so the four sharks never blink in unison. */
const DELAY: Record<SharkId, string> = { vikram: "0s", meera: "1.7s", arjun: "3.1s", zara: "4.4s" };

interface Props {
  shark: Shark;
  mood?: Mood;
  /** Size of the square portrait: pixels, or any CSS length such as "100%". */
  size?: number | string;
  /** Mouth flaps while the shark is speaking. */
  talking?: boolean;
  /** Idle blink and breathing; off for small repeated faces such as chat avatars. */
  animated?: boolean;
  /** Bump this (e.g. answer count) with a delta to play a nod (up) or head shake (down). */
  reactionKey?: number;
  delta?: number;
}

/** Pixel-art portrait. Decorative: the interest meter and the text carry the same information for assistive tech. */
export function SharkFace({ shark, mood = "neutral", size = 64, talking = false, animated = true, reactionKey = 0, delta = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastKey = useRef(reactionKey);

  useEffect(() => {
    if (reactionKey === lastKey.current) return;
    lastKey.current = reactionKey;
    const el = ref.current;
    if (!el || !delta || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frames =
      delta > 0
        ? [{ transform: "none" }, { transform: "translateY(5px)" }, { transform: "none" }, { transform: "translateY(4px)" }, { transform: "none" }]
        : [{ transform: "none" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "none" }];
    el.animate(frames, { duration: 650, easing: "steps(6)" });
  }, [reactionKey, delta]);

  const base = buildBase(shark.id);
  const f = buildFeatures(shark.id, mood);
  const live = animated && mood !== "out";
  const speaking = talking && mood !== "out";
  const delay = { animationDelay: DELAY[shark.id] };

  return (
    <div ref={ref} aria-hidden="true" className="inline-block shrink-0" style={typeof size === "number" ? { width: size, height: size } : { width: size, aspectRatio: "1" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%" shapeRendering="crispEdges" className={`face overflow-visible ${live ? "face-bob" : ""}`}>
        <Pixels runs={base.back} />
        <Pixels runs={f.blush} />
        {live ? (
          <>
            <g className="px-eyes-open" style={delay}>
              <Pixels runs={f.eyesOpen} />
            </g>
            <g className="px-eyes-shut" style={delay}>
              <Pixels runs={f.eyesShut} />
            </g>
          </>
        ) : (
          <g>
            <Pixels runs={mood === "out" ? f.eyesShut : f.eyesOpen} />
          </g>
        )}
        <Pixels runs={f.brows} />
        {speaking ? (
          <>
            <g className="px-talk-shut">
              <Pixels runs={f.mouthShut} />
            </g>
            <g className="px-talk-open">
              <Pixels runs={f.mouthOpen} />
            </g>
          </>
        ) : (
          <Pixels runs={f.mouthShut} />
        )}
        <Pixels runs={base.front} />
      </svg>
    </div>
  );
}
