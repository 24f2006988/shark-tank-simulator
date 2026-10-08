import { describe, expect, it } from "vitest";
import { emoteWord, reactionFor } from "@/components/emotes";
import { SHARK_IDS } from "@/lib/schemas";

describe("reactionFor", () => {
  const base = { id: "vikram", thinking: false, leaving: false, round: 0 } as const;

  it("keeps the interest-based mood when the answer barely moved the shark", () => {
    expect(reactionFor({ ...base, delta: 2 })).toEqual({ mood: null, emote: null });
  });

  it("exclaims, smiles, doubts or gets angry in proportion to the change", () => {
    expect(reactionFor({ ...base, delta: 18 })).toMatchObject({ mood: "surprised", emote: { kind: "exclaim" } });
    expect(reactionFor({ ...base, delta: 8 })).toMatchObject({ mood: "hooked", emote: { kind: "star" } });
    expect(reactionFor({ ...base, delta: -7 })).toMatchObject({ mood: "doubtful", emote: { kind: "question" } });
    expect(reactionFor({ ...base, delta: -15 })).toMatchObject({ mood: "cold", emote: { kind: "anger" } });
  });

  it("thinks while weighing an answer and is angry when walking out", () => {
    expect(reactionFor({ ...base, thinking: true })).toMatchObject({ mood: "thinking", emote: { kind: "dots" } });
    expect(reactionFor({ ...base, leaving: true, delta: 20 })).toMatchObject({ mood: "cold", emote: { kind: "anger" } });
  });

  it("varies the exclamation by shark and by round", () => {
    const words = new Set(SHARK_IDS.flatMap((id) => [0, 1, 2].map((round) => emoteWord("star", id, round))));
    expect(words.size).toBeGreaterThan(1);
  });
});
