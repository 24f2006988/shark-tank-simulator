import { describe, expect, it } from "vitest";
import { emoteWord, reactionFor } from "@/components/emotes";
import { EMOTE_GRID, SIZE, buildBase, buildEmote, buildFeatures, type PixelMood } from "@/components/pixel/sprites";
import { SHARK_IDS } from "@/lib/schemas";

const MOODS: PixelMood[] = ["hooked", "warm", "neutral", "doubtful", "cold", "out", "thinking", "surprised"];
const signature = (runs: { x: number; y: number; w: number; c: string }[]) => runs.map((r) => `${r.x},${r.y},${r.w},${r.c}`).join("|");

describe("pixel sprites", () => {
  it("draws every shark inside the grid", () => {
    for (const id of SHARK_IDS) {
      const { back, front } = buildBase(id);
      expect(back.length).toBeGreaterThan(50);
      for (const r of [...back, ...front]) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(SIZE);
        expect(r.y).toBeLessThan(SIZE);
      }
    }
  });

  it("gives each shark a different silhouette", () => {
    const sigs = new Set(SHARK_IDS.map((id) => signature(buildBase(id).back)));
    expect(sigs.size).toBe(SHARK_IDS.length);
  });

  it("changes the expression with the mood", () => {
    for (const id of SHARK_IDS) {
      const faces = new Set(MOODS.map((m) => signature([...buildFeatures(id, m).eyesOpen, ...buildFeatures(id, m).brows, ...buildFeatures(id, m).mouthShut])));
      expect(faces.size).toBe(MOODS.length);
    }
  });

  it("has an open mouth for talking and closed eyes for blinking that differ from the resting ones", () => {
    const f = buildFeatures("meera", "neutral");
    expect(signature(f.mouthOpen)).not.toBe(signature(f.mouthShut));
    expect(signature(f.eyesShut)).not.toBe(signature(f.eyesOpen));
  });

  it("draws every emote inside its grid", () => {
    for (const kind of ["exclaim", "star", "question", "anger", "dots"] as const) {
      const runs = buildEmote(kind);
      expect(runs.length).toBeGreaterThan(0);
      for (const r of runs) {
        expect(r.x + r.w).toBeLessThanOrEqual(EMOTE_GRID);
        expect(r.y).toBeLessThan(EMOTE_GRID);
      }
    }
  });
});

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
