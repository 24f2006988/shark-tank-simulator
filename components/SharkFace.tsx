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
  irisGlow: string;
  lip: string;
  /** Head outline: each shark has their own jaw so the panel reads at a glance, none of them pointed. */
  face: string;
  earX: number;
  eyeScale: number;
  browWidth: number;
  delay: string;
}

const LOOKS: Record<SharkId, Look> = {
  vikram: {
    skin: "#d39a6c", skinShade: "#b27650", hair: "#3f3f46", hairLight: "#b4b4bc", iris: "#3b2416", irisGlow: "#8a5a35", lip: "#8a3b32",
    face: "M23 45 C23 15 77 15 77 45 C78 66 68 82 50 82 C32 82 22 66 23 45Z", earX: 22.5, eyeScale: 0.92, browWidth: 3.2, delay: "0s",
  },
  meera: {
    skin: "#e0a77c", skinShade: "#c2855c", hair: "#1c1412", hairLight: "#5a3a30", iris: "#2a160c", irisGlow: "#8a4f2a", lip: "#a8403c",
    face: "M25 46 C25 14 75 14 75 46 C75 68 64 82 50 82 C36 82 25 68 25 46Z", earX: 24, eyeScale: 1.1, browWidth: 2.2, delay: "1.7s",
  },
  arjun: {
    skin: "#c08a5f", skinShade: "#9c6a45", hair: "#151313", hairLight: "#4a423d", iris: "#24150d", irisGlow: "#7a4a2a", lip: "#7a3a30",
    face: "M27 45 C27 14 73 14 73 45 C73 66 63 85 50 85 C37 85 27 66 27 45Z", earX: 26, eyeScale: 0.96, browWidth: 2.6, delay: "3.1s",
  },
  zara: {
    skin: "#ebbb94", skinShade: "#cf9670", hair: "#3a2233", hairLight: "#a47ccf", iris: "#3a2030", irisGlow: "#9a5a86", lip: "#b0306a",
    face: "M26 46 C26 14 74 14 74 46 C74 67 63 83 50 84 C37 83 26 67 26 46Z", earX: 25, eyeScale: 1.06, browWidth: 2, delay: "4.4s",
  },
};

const OUTLINE = "#4a3326";
const GOLD = "#f5c451";

/** Hair behind the head (drawn first). */
function HairBack({ id, fill }: { id: SharkId; fill: string }) {
  switch (id) {
    case "meera": // a big bun with a gold hairpin
      return (
        <g>
          <circle cx="50" cy="9" r="12" fill={fill} />
          <path d="M19 54 Q16 14 50 12 Q84 14 81 54 L76 54 Q76 22 50 20 Q24 22 24 54Z" fill={fill} />
          <path d="M34 6 L66 13" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="67" cy="13.4" r="2" fill={GOLD} />
        </g>
      );
    case "zara": // long, wavy, down to the shoulders
      return (
        <path
          d="M17 88 Q9 54 20 30 Q32 9 54 12 Q82 15 83 44 Q89 66 83 88 Q78 80 74 86 L72 62 L28 62 L26 86 Q22 80 17 88Z"
          fill={fill}
        />
      );
    case "arjun": // cowlick at the crown
      return <path d="M42 20 Q46 -2 60 4 Q54 9 57 20Z" fill={fill} />;
    default:
      return null;
  }
}

/** Fringe and hairline (drawn over the forehead). */
function HairFront({ id, fill, light }: { id: SharkId; fill: string; light: string }) {
  switch (id) {
    case "vikram": // receding, swept back, grey at the temples
      return (
        <g>
          <path d="M23 44 Q20 15 46 12 Q73 10 77 32 Q78 40 77 44 Q73 27 60 22 Q46 19 35 27 Q27 33 23 44Z" fill={fill} stroke={OUTLINE} strokeWidth="0.7" />
          <path d="M23 44 Q22 34 28 29 L30 45Z M77 44 Q78 34 72 29 L70 45Z" fill={light} />
          <path d="M38 16 Q54 11 68 18" fill="none" stroke={light} strokeWidth="1.2" opacity="0.7" />
        </g>
      );
    case "meera": // centre parting framing the face
      return (
        <g>
          <path d="M24 50 Q23 18 50 17 Q77 18 76 50 Q72 29 52 24 L50 21.5 L48 24 Q28 29 24 50Z" fill={fill} stroke={OUTLINE} strokeWidth="0.7" />
          <path d="M30 26 Q38 20 46 21" fill="none" stroke={light} strokeWidth="1.2" />
          <path className="hair-sway" d="M25 48 Q21 62 26 74" fill="none" stroke={fill} strokeWidth="2.8" strokeLinecap="round" />
        </g>
      );
    case "arjun": // tall, messy, slept-at-the-desk hair
      return (
        <g>
          <path
            className="hair-sway"
            d="M26 46 Q17 20 32 12 Q36 0 45 5 Q51 -4 59 5 Q69 1 72 12 Q85 20 74 46 Q72 33 67 29 L65 36 L62 27 L56 34 L52 25 L46 33 L42 26 L36 34 L33 28 Q28 34 26 46Z"
            fill={fill}
            stroke={OUTLINE}
            strokeWidth="0.7"
          />
          <path d="M37 15 Q46 9 56 13" fill="none" stroke={light} strokeWidth="1.2" />
        </g>
      );
    case "zara": // swept wavy fringe with a violet streak
      return (
        <g>
          <path className="hair-sway" d="M25 47 Q21 16 52 14 Q78 15 79 42 Q66 24 48 28 Q34 32 25 47Z" fill={fill} stroke={OUTLINE} strokeWidth="0.7" />
          <path d="M33 22 Q48 14 65 20" fill="none" stroke={light} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M58 21 Q66 24 70 36" fill="none" stroke={light} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
        </g>
      );
  }
}

/** Clothes and neckwear: each silhouette differs (broad blazer, dupatta, hoodie and headphones, lapels). */
function Outfit({ id }: { id: SharkId }) {
  switch (id) {
    case "vikram":
      return (
        <g>
          <path d="M5 100 Q7 83 34 81 L66 81 Q93 83 95 100Z" fill="#1e2a44" />
          <path d="M41 81 L50 97 L59 81Z" fill="#f1f5f9" />
          <path d="M48.5 85 L51.5 85 L53 97 L50 100 L47 97Z" fill={GOLD} />
          <path d="M34 81 L43 99 M66 81 L57 99" stroke="#131c30" strokeWidth="1.6" fill="none" />
          <path d="M70 90 L78 89 L78 94 L70 94Z" fill="#e11d48" />
        </g>
      );
    case "meera":
      return (
        <g>
          <path d="M12 100 Q14 86 36 83 L64 83 Q86 86 88 100Z" fill="#fb7185" />
          <path d="M40 83 Q50 93 60 83" fill="none" stroke="#fde68a" strokeWidth="1.6" />
          <path d="M14 90 Q40 94 62 100 L86 100 L84 94 Q50 88 14 84Z" fill="#0f766e" />
          <path d="M14 90 Q40 94 62 100" fill="none" stroke={GOLD} strokeWidth="1.4" />
        </g>
      );
    case "arjun":
      return (
        <g>
          <path d="M8 100 Q10 83 33 81 L67 81 Q90 83 92 100Z" fill="#0e7490" />
          <path d="M30 81 Q50 97 70 81 Q64 73 50 75 Q36 73 30 81Z" fill="#0b5367" />
          <path d="M45 88 L44 98 M55 88 L56 98" stroke="#a5f3fc" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M31 83 Q50 99 69 83" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="30" cy="87" rx="4.6" ry="6.4" fill="#111827" />
          <ellipse cx="70" cy="87" rx="4.6" ry="6.4" fill="#111827" />
          <ellipse cx="30" cy="87" rx="2.2" ry="3.4" fill="#22d3ee" />
          <ellipse cx="70" cy="87" rx="2.2" ry="3.4" fill="#22d3ee" />
        </g>
      );
    case "zara":
      return (
        <g>
          <path d="M12 100 Q14 86 36 83 L64 83 Q86 86 88 100Z" fill="#6d28d9" />
          <path d="M38 83 L50 96 L62 83Z" fill="#f5f3ff" />
          <path d="M36 83 L47 100 M64 83 L53 100" stroke="#a78bfa" strokeWidth="1.6" fill="none" />
          <circle cx="68" cy="92" r="2.2" fill={GOLD} />
        </g>
      );
  }
}

/** Details drawn on top of the face: glasses and beard, bindi and earrings, stubble, lipstick sheen. */
function Extras({ id, look, clip }: { id: SharkId; look: Look; clip: string }) {
  const earR = 100 - look.earX;
  const star = (cx: number) => `M${cx} 59 l1.3 2.7 3 .4 -2.2 2.1 .5 3 -2.6-1.4 -2.6 1.4 .5-3 -2.2-2.1 3-.4Z`;
  const clipUrl = `url(#${clip})`;
  switch (id) {
    case "vikram":
      return (
        <g>
          <path
            d="M15 58 H85 V95 H15Z M35 62 Q50 57 65 62 Q69 75 50 78 Q31 75 35 62Z"
            fillRule="evenodd"
            fill={look.hairLight}
            opacity="0.9"
            clipPath={clipUrl}
          />
          <path d="M40.5 62.5 Q46 59.5 50 61.5 Q54 59.5 59.5 62.5 Q54 64.4 50 63.2 Q46 64.4 40.5 62.5Z" fill={look.hairLight} />
          <g fill="none" stroke="#27272a" strokeWidth="1.4">
            <circle cx="39" cy="50" r="7.6" />
            <circle cx="61" cy="50" r="7.6" />
            <path d="M46.6 49.5 Q50 47.5 53.4 49.5 M31.4 49 L23 47 M68.6 49 L77 47" />
          </g>
          <path d="M34 46 L37 44" stroke="white" strokeWidth="1" opacity="0.5" />
        </g>
      );
    case "meera":
      return (
        <g>
          <circle cx="50" cy="38" r="1.7" fill="#dc2626" />
          {[look.earX, earR].map((x) => (
            <g key={x}>
              <circle cx={x} cy="58.5" r="1.6" fill={GOLD} />
              <path d={`M${x - 2.4} 60 Q${x} 68 ${x + 2.4} 60Z`} fill={GOLD} />
              <circle cx={x} cy="66.2" r="0.9" fill="#fff7d6" />
            </g>
          ))}
        </g>
      );
    case "arjun":
      return (
        <g>
          <path
            d="M15 60 Q50 70 85 60 V95 H15Z M37 63 Q50 60 63 63 Q67 75 50 77 Q33 75 37 63Z"
            fillRule="evenodd"
            fill={look.hair}
            opacity="0.24"
            clipPath={clipUrl}
          />
          <circle cx={look.earX} cy="58" r="1.4" fill="#d4d4d8" />
        </g>
      );
    case "zara":
      return (
        <g>
          <g fill={GOLD}>
            <path d={star(look.earX - 1)} />
            <path d={star(earR + 1)} />
          </g>
          <path d="M45 67 Q50 69.4 55 67" fill="none" stroke="#ffd1e6" strokeWidth="0.7" opacity="0.7" strokeLinecap="round" />
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
  const hair = `hair-${uid}`;
  const clip = `clip-${uid}`;
  const sparkle = mood === "hooked";
  // Large glossy irises under a heavy upper lash with a small outer flick: the film look, not the emoji look.
  const eye = (cx: number, side: -1 | 1): ReactNode => (
    <g transform={`translate(${cx} 50) scale(${look.eyeScale}) translate(${-cx} -50)`}>
      <ellipse cx={cx} cy="50" rx="5.3" ry="4.7" fill="#fffaf2" stroke={OUTLINE} strokeWidth="0.4" />
      <g className={live ? "face-glance" : undefined} style={live ? { animationDelay: look.delay } : undefined}>
        <ellipse cx={cx} cy="50.4" rx="3.7" ry="4.4" fill={look.iris} />
        <ellipse cx={cx} cy="51.2" rx="2.4" ry="2.6" fill={look.irisGlow} opacity="0.55" />
        <ellipse cx={cx} cy="50.4" rx="1.5" ry="2.1" fill="#0b0705" />
        <circle cx={cx - 1.4} cy="48.6" r="1.5" fill="white" />
        <circle cx={cx + 1.4} cy="52" r={sparkle ? 1 : 0.6} fill="white" />
      </g>
      <path d={`M${cx - 5.8} 47.8 Q${cx} 43.4 ${cx + 5.8} 47.8`} fill="none" stroke={OUTLINE} strokeWidth="1.9" strokeLinecap="round" />
      <path d={`M${cx + side * 5.8} 47.8 l${side * 1.7} -1.3`} fill="none" stroke={OUTLINE} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );

  return (
    <div ref={ref} aria-hidden="true" className="inline-block shrink-0" style={typeof size === "number" ? { width: size, height: size } : { width: size, aspectRatio: "1" }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" className="face overflow-visible">
        <defs>
          <clipPath id={clip}>
            <path d={look.face} />
          </clipPath>
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
            <ellipse cx={look.earX} cy="53" rx="3.6" ry="6" fill={look.skinShade} />
            <ellipse cx={100 - look.earX} cy="53" rx="3.6" ry="6" fill={look.skinShade} />
            <path d={look.face} fill={look.skin} stroke={OUTLINE} strokeWidth="0.7" />
            <ellipse cx="80" cy="52" rx="15" ry="42" fill={look.skinShade} opacity="0.3" clipPath={`url(#${clip})`} />

            <g className="face-part" style={{ opacity: e.blush }}>
              <ellipse cx="32.5" cy="61" rx="5.5" ry="3" fill="#f08a8a" opacity="0.55" />
              <ellipse cx="67.5" cy="61" rx="5.5" ry="3" fill="#f08a8a" opacity="0.55" />
            </g>

            <g className="face-part" style={{ transform: `scaleY(${e.eyes})` }}>
              <g className={live ? "face-blink" : undefined} style={live ? { animationDelay: look.delay } : undefined}>
                {eye(39, -1)}
                {eye(61, 1)}
              </g>
            </g>

            <g stroke={look.hair} strokeWidth={look.browWidth} strokeLinecap="round">
              <path d="M33 41.5 Q38.5 39.5 44 41" fill="none" className="face-part" style={{ transform: e.brows[0] }} />
              <path d="M56 41 Q61.5 39.5 67 41.5" fill="none" className="face-part" style={{ transform: e.brows[1] }} />
            </g>

            <path d="M50.7 57 Q49.7 59 51.5 59.5" fill="none" stroke={look.skinShade} strokeWidth="0.9" strokeLinecap="round" />

            {talking && mood !== "out" ? (
              <g className="face-talk">
                <ellipse cx="50" cy="67" rx="4" ry="3" fill="#7a2c2c" stroke={OUTLINE} strokeWidth="0.8" />
                <ellipse cx="50" cy="68.6" rx="2.2" ry="1" fill="#e07a7a" />
              </g>
            ) : (
              <path d={e.mouth} className="face-part" style={{ d: `path("${e.mouth}")` }} fill="none" stroke={look.lip} strokeWidth="1.4" strokeLinecap="round" />
            )}

            <Extras id={shark.id} look={look} clip={clip} />
            <HairFront id={shark.id} fill={`url(#${hair})`} light={look.hairLight} />
          </g>
        </g>
      </svg>
    </div>
  );
}
