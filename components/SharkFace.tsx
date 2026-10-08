"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { Shark } from "@/lib/sharks";
import type { SharkId } from "@/lib/types";

export type Mood = "hooked" | "warm" | "neutral" | "doubtful" | "cold" | "out";

/** Expression from interest, using the same bands as the meter's words. */
export function moodFor(interest: number, status: "in" | "out" = "in"): Mood {
  if (status === "out") return "out";
  if (interest >= 80) return "hooked";
  if (interest >= 60) return "warm";
  if (interest >= 40) return "neutral";
  if (interest >= 20) return "doubtful";
  return "cold";
}

interface Expression {
  mouth: string;
  /** Vertical eye openness (1 = relaxed). */
  eyes: number;
  /** [left, right] brow transforms. */
  brows: [string, string];
  tilt: string;
  blush: number;
}

// Every mouth uses the same "M Q" shape so browsers that support CSS `d` can morph between them.
const EXPRESSIONS: Record<Mood, Expression> = {
  hooked: { mouth: "M41 65 Q50 75 59 65", eyes: 1.08, brows: ["translateY(-2.5px) rotate(-7deg)", "translateY(-2.5px) rotate(7deg)"], tilt: "rotate(2deg)", blush: 0.85 },
  warm: { mouth: "M43 66 Q50 71 57 66", eyes: 1, brows: ["translateY(-1px)", "translateY(-1px)"], tilt: "rotate(3deg)", blush: 0.6 },
  neutral: { mouth: "M44 67.5 Q50 68.5 56 67.5", eyes: 0.95, brows: ["none", "none"], tilt: "rotate(-2deg)", blush: 0.3 },
  doubtful: { mouth: "M44 69 Q50 66 57 66.5", eyes: 0.8, brows: ["translateY(1px) rotate(9deg)", "translateY(-3px) rotate(-3deg)"], tilt: "rotate(-5deg)", blush: 0.15 },
  cold: { mouth: "M43 70 Q50 64 57 70", eyes: 0.55, brows: ["translateY(2px) rotate(15deg)", "translateY(2px) rotate(-15deg)"], tilt: "rotate(0deg)", blush: 0 },
  out: { mouth: "M45 68 Q50 67.5 55 68", eyes: 0.1, brows: ["translateY(1.5px)", "translateY(1.5px)"], tilt: "rotate(9deg) translateX(3px)", blush: 0 },
};

interface Look {
  skin: string;
  skinShade: string;
  hair: string;
  hairLight: string;
  iris: string;
  delay: string;
}

const LOOKS: Record<SharkId, Look> = {
  vikram: { skin: "#d39a6c", skinShade: "#b27650", hair: "#3f3f46", hairLight: "#a1a1aa", iris: "#3b2416", delay: "0s" },
  meera: { skin: "#e0a77c", skinShade: "#c2855c", hair: "#1c1412", hairLight: "#4a302a", iris: "#2a160c", delay: "1.7s" },
  arjun: { skin: "#c08a5f", skinShade: "#9c6a45", hair: "#151313", hairLight: "#3a3330", iris: "#24150d", delay: "3.1s" },
  zara: { skin: "#ebbb94", skinShade: "#cf9670", hair: "#3a2233", hairLight: "#8b6aa8", iris: "#3a2030", delay: "4.4s" },
};

const OUTLINE = "#4a3326";

/** Hair behind the head (drawn first). */
function HairBack({ id, fill }: { id: SharkId; fill: string }) {
  if (id === "meera")
    return (
      <g fill={fill}>
        <circle cx="50" cy="11" r="9.5" />
        <path d="M19 52 Q16 14 50 12 Q84 14 81 52 L76 52 Q76 22 50 20 Q24 22 24 52Z" />
      </g>
    );
  if (id === "zara") return <path d="M17 84 Q10 52 20 30 Q32 9 54 12 Q82 15 83 44 Q88 66 82 86 L72 86 Q79 62 75 46 L25 46 Q21 64 28 86Z" fill={fill} />;
  return null;
}

/** Fringe and hairline (drawn over the forehead). */
function HairFront({ id, fill, light }: { id: SharkId; fill: string; light: string }) {
  switch (id) {
    case "vikram": // neat side parting, grey at the temples
      return (
        <g>
          <path d="M24 46 Q21 17 46 13 Q71 11 77 34 Q78 41 76 46 Q72 29 59 25 Q45 23 35 30 Q28 36 24 46Z" fill={fill} stroke={OUTLINE} strokeWidth="0.8" />
          <path d="M24 46 Q23 36 28 31 L29.5 47Z M76 46 Q77 36 72 31 L70.5 47Z" fill={light} />
          <path d="M40 18 Q54 14 66 20" fill="none" stroke={light} strokeWidth="1.2" opacity="0.6" />
        </g>
      );
    case "meera": // centre parting framing the face
      return (
        <g>
          <path d="M24 49 Q23 18 50 17 Q77 18 76 49 Q72 29 52 24 L50 21.5 L48 24 Q28 29 24 49Z" fill={fill} stroke={OUTLINE} strokeWidth="0.8" />
          <path d="M30 26 Q38 20 46 21" fill="none" stroke={light} strokeWidth="1.2" />
          <path className="hair-sway" d="M25 47 Q21 60 26 71" fill="none" stroke={fill} strokeWidth="2.6" strokeLinecap="round" />
        </g>
      );
    case "arjun": // messy, slept-at-the-desk hair
      return (
        <g>
          <path
            className="hair-sway"
            d="M23 45 Q19 22 33 15 Q40 9 50 12 Q60 8 68 14 Q81 21 77 45 Q74 34 68 30 L66 37 L62 28 L56 34 L52 26 L46 33 L42 27 L36 35 L33 29 Q27 35 23 45Z"
            fill={fill}
            stroke={OUTLINE}
            strokeWidth="0.8"
          />
          <path d="M38 17 Q46 13 54 15" fill="none" stroke={light} strokeWidth="1.2" />
        </g>
      );
    case "zara": // swept wavy fringe with a violet sheen
      return (
        <g>
          <path className="hair-sway" d="M24 47 Q21 17 52 14 Q77 15 78 41 Q66 24 48 28 Q34 32 24 47Z" fill={fill} stroke={OUTLINE} strokeWidth="0.8" />
          <path d="M34 22 Q48 15 64 20" fill="none" stroke={light} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
  }
}

/** Clothes in the shark's accent colour. */
function Outfit({ id }: { id: SharkId }) {
  switch (id) {
    case "vikram":
      return (
        <g>
          <path d="M12 100 Q14 86 36 83 L64 83 Q86 86 88 100Z" fill="#1e2a44" />
          <path d="M42 83 L50 97 L58 83Z" fill="#f1f5f9" />
          <path d="M48.5 85 L51.5 85 L53 97 L50 100 L47 97Z" fill="#fbbf24" />
        </g>
      );
    case "meera":
      return (
        <g>
          <path d="M12 100 Q14 86 36 83 L64 83 Q86 86 88 100Z" fill="#fb7185" />
          <path d="M40 83 Q50 92 60 83" fill="none" stroke="#fde68a" strokeWidth="1.6" />
        </g>
      );
    case "arjun":
      return (
        <g>
          <path d="M10 100 Q12 84 34 81 L66 81 Q88 84 90 100Z" fill="#0e7490" />
          <path d="M36 81 Q50 90 64 81" fill="none" stroke="#155e75" strokeWidth="3" />
          <path d="M45 87 L44 97 M55 87 L56 97" stroke="#a5f3fc" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
    case "zara":
      return (
        <g>
          <path d="M12 100 Q14 86 36 83 L64 83 Q86 86 88 100Z" fill="#7c3aed" />
          <path d="M38 83 L50 94 L62 83" fill="none" stroke="#ddd6fe" strokeWidth="1.4" />
        </g>
      );
  }
}

/** Details drawn on top of the face: glasses, moustache, bindi, stubble, earrings. */
function Extras({ id, hair, light }: { id: SharkId; hair: string; light: string }) {
  const gold = "#f5c451";
  const star = (cx: number) => `M${cx} 59 l1.3 2.7 3 .4 -2.2 2.1 .5 3 -2.6-1.4 -2.6 1.4 .5-3 -2.2-2.1 3-.4Z`;
  switch (id) {
    case "vikram":
      return (
        <g>
          <path d="M41.5 62.5 Q46 59.5 50 61.5 Q54 59.5 58.5 62.5 Q54 64 50 63 Q46 64 41.5 62.5Z" fill={light} />
          <g fill="none" stroke="#27272a" strokeWidth="1.3">
            <circle cx="39" cy="50" r="7.2" />
            <circle cx="61" cy="50" r="7.2" />
            <path d="M46.2 49.5 Q50 47.5 53.8 49.5 M31.8 49 L25 47 M68.2 49 L75 47" />
          </g>
          <path d="M34 46 L37 44" stroke="white" strokeWidth="1" opacity="0.5" />
        </g>
      );
    case "meera":
      return (
        <g>
          <circle cx="50" cy="38" r="1.6" fill="#dc2626" />
          <circle cx="24" cy="61" r="2.2" fill={gold} />
          <circle cx="76" cy="61" r="2.2" fill={gold} />
        </g>
      );
    case "arjun":
      return <path d="M31 64 Q50 87 69 64 Q67 76 50 81 Q33 76 31 64Z" fill={hair} opacity="0.13" />;
    case "zara":
      return (
        <g fill={gold}>
          <path d={star(23)} />
          <path d={star(77)} />
        </g>
      );
  }
}

interface Props {
  shark: Shark;
  mood?: Mood;
  /** Size of the square face: pixels, or any CSS length such as "100%". */
  size?: number | string;
  /** Mouth moves while the shark is speaking. */
  talking?: boolean;
  /** Idle blink, glance, hair sway and breathing; off for small repeated faces such as chat avatars. */
  animated?: boolean;
  /** Bump this (e.g. answer count) with a delta to play a nod (up) or head shake (down). */
  reactionKey?: number;
  delta?: number;
}

/** Decorative hand-drawn portrait; the interest meter and text carry the same information for assistive tech. */
export function SharkFace({ shark, mood = "neutral", size = 64, talking = false, animated = true, reactionKey = 0, delta = 0 }: Props) {
  const e = EXPRESSIONS[mood];
  const look = LOOKS[shark.id];
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
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
        : [{ transform: "none" }, { transform: "rotate(-9deg)" }, { transform: "rotate(8deg)" }, { transform: "rotate(-5deg)" }, { transform: "none" }];
    el.animate(frames, { duration: 750, easing: "ease-in-out" });
  }, [reactionKey, delta]);

  const live = animated && mood !== "out";
  const skin = `skin-${uid}`;
  const hair = `hair-${uid}`;
  const sparkle = mood === "hooked";
  const eye = (cx: number): ReactNode => (
    <g>
      <ellipse cx={cx} cy="50" rx="5.4" ry="4.4" fill="#fffaf2" stroke={OUTLINE} strokeWidth="0.7" />
      <g className={live ? "face-glance" : undefined} style={live ? { animationDelay: look.delay } : undefined}>
        <circle cx={cx} cy="50.3" r="3.7" fill={look.iris} />
        <circle cx={cx} cy="50.3" r="1.7" fill="#0b0705" />
        <circle cx={cx - 1.3} cy="48.9" r="1.3" fill="white" />
        <circle cx={cx + 1.3} cy="51.6" r={sparkle ? 0.9 : 0.55} fill="white" />
      </g>
      <path d={`M${cx - 5.8} 47.6 Q${cx} 44 ${cx + 5.8} 47.6`} fill="none" stroke={OUTLINE} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );

  return (
    <div ref={ref} aria-hidden="true" className="inline-block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" className="face overflow-visible">
        <defs>
          <radialGradient id={skin} cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor={look.skin} />
            <stop offset="100%" stopColor={look.skinShade} />
          </radialGradient>
          <linearGradient id={hair} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={look.hairLight} stopOpacity="0.9" />
            <stop offset="35%" stopColor={look.hair} />
          </linearGradient>
        </defs>

        <g className={live ? "face-bob" : undefined}>
          <Outfit id={shark.id} />
          <path d="M43 74 L43 86 Q50 89 57 86 L57 74Z" fill={look.skinShade} />

          <g className="face-tilt" style={{ transform: e.tilt }}>
            <HairBack id={shark.id} fill={`url(#${hair})`} />
            <ellipse cx="24" cy="53" rx="3.6" ry="6" fill={look.skinShade} />
            <ellipse cx="76" cy="53" rx="3.6" ry="6" fill={look.skinShade} />
            <path d="M24 46 Q24 16 50 16 Q76 16 76 46 Q76 70 50 80 Q24 70 24 46Z" fill={`url(#${skin})`} stroke={OUTLINE} strokeWidth="0.9" />

            <g className="face-part" style={{ opacity: e.blush }}>
              <ellipse cx="32.5" cy="61" rx="5.5" ry="3" fill="#f08a8a" opacity="0.55" />
              <ellipse cx="67.5" cy="61" rx="5.5" ry="3" fill="#f08a8a" opacity="0.55" />
            </g>

            <g className="face-part" style={{ transform: `scaleY(${e.eyes})` }}>
              <g className={live ? "face-blink" : undefined} style={live ? { animationDelay: look.delay } : undefined}>
                {eye(39)}
                {eye(61)}
              </g>
            </g>

            <g stroke={look.hair} strokeWidth="2.2" strokeLinecap="round">
              <path d="M33 41.5 Q38.5 39.5 44 41" fill="none" className="face-part" style={{ transform: e.brows[0] }} />
              <path d="M56 41 Q61.5 39.5 67 41.5" fill="none" className="face-part" style={{ transform: e.brows[1] }} />
            </g>

            <path d="M50.5 54 Q49 58.5 51.5 59" fill="none" stroke={look.skinShade} strokeWidth="1.3" strokeLinecap="round" />

            {talking && mood !== "out" ? (
              <g className="face-talk">
                <ellipse cx="50" cy="67" rx="4" ry="3" fill="#7a2c2c" stroke={OUTLINE} strokeWidth="0.8" />
                <ellipse cx="50" cy="68.6" rx="2.2" ry="1" fill="#e07a7a" />
              </g>
            ) : (
              <path d={e.mouth} className="face-part" style={{ d: `path("${e.mouth}")` }} fill="none" stroke="#8a3b32" strokeWidth="1.7" strokeLinecap="round" />
            )}

            <Extras id={shark.id} hair={look.hair} light={look.hairLight} />
            <HairFront id={shark.id} fill={`url(#${hair})`} light={look.hairLight} />
          </g>
        </g>
      </svg>
    </div>
  );
}
