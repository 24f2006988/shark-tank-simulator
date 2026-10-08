import type { SharkId } from "@/lib/types";
import type { Mood } from "./SharkFace";

export type EmoteKind = "exclaim" | "star" | "question" | "anger" | "dots";

export interface Emote {
  kind: EmoteKind;
  word: string;
}

const WORDS: Record<EmoteKind, string[]> = {
  exclaim: ["Wow!", "Whoa!", "Oho!"],
  star: ["Nice!", "Ha!", "Love it!"],
  question: ["Hmm?", "Really?", "Eh?"],
  anger: ["Ugh.", "No way!", "Enough!"],
  dots: ["Hmm…", "Let me think…"],
};

const ORDER: Record<SharkId, number> = { vikram: 0, meera: 1, arjun: 2, zara: 3 };

/** Varies by shark and by round, so the same reaction does not get the same word every time. */
export function emoteWord(kind: EmoteKind, id: SharkId, round: number): string {
  const words = WORDS[kind];
  return words[(ORDER[id] + round) % words.length];
}

interface Input {
  id: SharkId;
  /** Change in this shark's interest after the latest answer. */
  delta?: number;
  /** The shark is weighing an answer right now. */
  thinking: boolean;
  /** The shark is announcing they are out. */
  leaving: boolean;
  round: number;
}

export interface Reaction {
  /** Overrides the mood the shark's interest would give; null keeps it. */
  mood: Mood | null;
  emote: Emote | null;
}

/** How a shark reacts on the face: an expression and an exclamation badge that fit how the answer landed. */
export function reactionFor({ id, delta = 0, thinking, leaving, round }: Input): Reaction {
  const pick = (kind: EmoteKind, mood: Mood): Reaction => ({ mood, emote: { kind, word: emoteWord(kind, id, round) } });
  if (leaving) return pick("anger", "cold");
  if (thinking) return pick("dots", "thinking");
  if (delta >= 15) return pick("exclaim", "surprised");
  if (delta >= 6) return pick("star", "hooked");
  if (delta <= -12) return pick("anger", "cold");
  if (delta <= -5) return pick("question", "doubtful");
  return { mood: null, emote: null };
}
