import type { SharkId } from "@/lib/types";

/**
 * Animal Crossing style "mumble": each typed letter plays a short synthesized blip instead of real speech.
 * Pure Web Audio, so no audio files, no network and no voice engine to stutter.
 */

/** Base pitch (Hz) and timbre per shark, so each one has a recognisable voice. */
const VOICE: Record<SharkId, { base: number; wave: OscillatorType }> = {
  vikram: { base: 150, wave: "square" },
  arjun: { base: 190, wave: "sawtooth" },
  meera: { base: 290, wave: "triangle" },
  zara: { base: 350, wave: "square" },
};

const VOWELS = "aeiouy";
/** Steps (as fractions of the base pitch) chosen per letter, so the same word always sounds the same. */
const STEPS = [-0.12, -0.06, 0, 0.05, 0.1, 0.16, -0.03];

export interface Blip {
  freq: number;
  wave: OscillatorType;
  /** Seconds the blip lasts. */
  duration: number;
}

/**
 * The blip for one character, or null when it should be silent (spaces, punctuation).
 * Vowels sit a little higher; the last few letters of a question rise, like a real question.
 */
export function blipFor(sharkId: SharkId, char: string, index: number, text: string): Blip | null {
  const c = char.toLowerCase();
  if (!/[a-z0-9]/.test(c)) return null;
  const { base, wave } = VOICE[sharkId];
  let ratio = 1 + STEPS[c.charCodeAt(0) % STEPS.length];
  if (VOWELS.includes(c)) ratio += 0.08;
  const trimmed = text.trimEnd();
  if (trimmed.endsWith("?") && index >= trimmed.length - 6) ratio += 0.25;
  return { freq: Math.round(base * ratio), wave, duration: 0.06 };
}

let ctx: AudioContext | null = null;

export const canMumble = () => typeof window !== "undefined" && "AudioContext" in window;

/** Plays one blip. Silently does nothing if audio is unavailable or still locked by autoplay rules. */
export function playBlip(blip: Blip): void {
  if (!canMumble()) return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = blip.wave;
  // A quick downward glide makes it sound like a syllable instead of a beep.
  osc.frequency.setValueAtTime(blip.freq * 1.08, now);
  osc.frequency.exponentialRampToValueAtTime(blip.freq, now + blip.duration);
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + blip.duration);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + blip.duration + 0.02);
}
