import { createSharks } from "@/lib/game";
import { pitchSchema } from "@/lib/schemas";
import type { Difficulty, Pitch, SharkId, Sharks, Turn } from "@/lib/types";

export function makePitch(overrides: Partial<Pitch> = {}): Pitch {
  return pitchSchema.parse({
    ideaName: "ChaiCart",
    oneLiner: "Hot chai delivered to offices in 10 minutes",
    askLakh: 50,
    equityPct: 10,
    description: "We run e-bike chai carts around tech parks in Bengaluru. Offices subscribe for daily chai rounds.",
    difficulty: "realistic",
    ...overrides,
  });
}

export function makeSharks(difficulty: Difficulty = "realistic", interest: Partial<Record<SharkId, number>> = {}): Sharks {
  const sharks = createSharks(difficulty);
  for (const [id, value] of Object.entries(interest)) sharks[id as SharkId].interest = value;
  return sharks;
}

export function makeTurn(sharkId: SharkId, answer?: string, extra: Partial<Turn> = {}): Turn {
  return { sharkId, question: `Question from ${sharkId}?`, probing: "economics", isFollowUp: false, answer, ...extra };
}
