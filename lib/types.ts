import type { z } from "zod";
import type {
  debriefSchema,
  dealSchema,
  offerSchema,
  pitchSchema,
  reactionSchema,
  sharkStateSchema,
  termsSchema,
  turnSchema,
} from "./schemas";
import type { DIFFICULTIES, DIMENSIONS, SHARK_IDS } from "./schemas";

export type SharkId = (typeof SHARK_IDS)[number];
export type Dimension = (typeof DIMENSIONS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Stage = "questioning" | "deal" | "debrief";
export type Source = "ai" | "fallback";

export type Pitch = z.output<typeof pitchSchema>;
export type PitchInput = z.input<typeof pitchSchema>;
export type Reaction = z.output<typeof reactionSchema>;
export type SharkState = z.output<typeof sharkStateSchema>;
export type Sharks = Record<SharkId, SharkState>;
export type Turn = z.output<typeof turnSchema>;
export type Terms = z.output<typeof termsSchema>;
export type Offer = z.output<typeof offerSchema>;
export type Deal = z.output<typeof dealSchema>;
export type Debrief = z.output<typeof debriefSchema>;

export interface Question {
  sharkId: SharkId;
  question: string;
  probing: Dimension;
  isFollowUp: boolean;
}

export interface Evaluation {
  quality: 1 | 2 | 3 | 4 | 5;
  vague: boolean;
  reactions: Reaction[];
  walkouts: { sharkId: SharkId; reason: string }[];
}

/** Response bodies of the API routes, wrapped as { data, source }. */
export interface TurnResult {
  evaluation: Evaluation | null;
  sharks: Sharks;
  next: Question | null;
  over: boolean;
}

export interface OffersResult {
  offers: Offer[];
  outs: { sharkId: SharkId; reason: string }[];
}

export interface NegotiateResult {
  response: "accept" | "counter" | "walk";
  amountLakh: number;
  equityPct: number;
  line: string;
}

export interface ApiResponse<T> {
  data: T;
  source: Source;
}
