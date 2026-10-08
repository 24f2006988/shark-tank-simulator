import { z } from "zod";

// Zod 4 probes for eval support with `new Function("")`, which our CSP (no unsafe-eval) reports as a violation.
z.config({ jitless: true });

import { DIFFICULTIES, DIMENSIONS, LIMITS, SHARK_IDS } from "./constants";

// Re-exported so server code can keep importing them from here; client code should use ./constants.
export { DIFFICULTIES, DIMENSIONS, LIMITS, SHARK_IDS };

/** Strips control characters, collapses whitespace and neutralises angle brackets so user text cannot fake prompt tags. */
export function cleanText(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function text(label: string, min: number, max: number) {
  return z
    .string({ error: `${label} must be text` })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(min, min === 1 ? `${label} is required` : `${label} needs at least ${min} characters`)
        .max(max, `${label} must be at most ${max} characters`),
    );
}

function amount(label: string, min: number, max: number) {
  return z
    .number({ error: `${label} must be a number` })
    .finite(`${label} must be a number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);
}

export const sharkIdSchema = z.enum(SHARK_IDS);
export const dimensionSchema = z.enum(DIMENSIONS);
export const difficultySchema = z.enum(DIFFICULTIES);

export const pitchSchema = z.object({
  ideaName: text("Idea name", LIMITS.ideaName.min, LIMITS.ideaName.max),
  oneLiner: text("One-liner", 0, LIMITS.oneLiner.max).default(""),
  askLakh: amount("Ask amount (Rs lakh)", 1, 10_000),
  equityPct: amount("Equity offered (%)", 0.5, 90),
  description: text("Pitch", LIMITS.description.min, LIMITS.description.max),
  difficulty: difficultySchema.default("realistic"),
});

export const reactionSchema = z.object({
  sharkId: sharkIdSchema,
  delta: z.number().finite(),
  line: text("Reaction", 0, LIMITS.line.max),
});

export const sharkStateSchema = z.object({
  id: sharkIdSchema,
  interest: z.number().finite().min(0).max(100),
  status: z.enum(["in", "out"]),
  outReason: text("Reason", 0, LIMITS.line.max).optional(),
});

export const sharksSchema = z.record(sharkIdSchema, sharkStateSchema);

export const turnSchema = z.object({
  sharkId: sharkIdSchema,
  question: text("Question", 1, LIMITS.question.max),
  probing: dimensionSchema,
  isFollowUp: z.boolean(),
  answer: text("Answer", 1, LIMITS.answer.max).optional(),
  quality: z.number().int().min(1).max(5).optional(),
  vague: z.boolean().optional(),
  reactions: z.array(reactionSchema).max(SHARK_IDS.length).optional(),
});

export const termsSchema = z.object({
  amountLakh: amount("Amount (Rs lakh)", 1, 20_000),
  equityPct: amount("Equity (%)", 0.5, 90),
});

export const offerSchema = termsSchema.extend({
  sharkId: sharkIdSchema,
  condition: text("Condition", 0, LIMITS.line.max).optional(),
  line: text("Offer line", 0, LIMITS.line.max),
});

export const dealSchema = termsSchema.extend({
  sharkId: sharkIdSchema,
  condition: text("Condition", 0, LIMITS.line.max).optional(),
});

const sessionCore = {
  pitch: pitchSchema,
  sharks: sharksSchema,
  turns: z.array(turnSchema).max(LIMITS.turns),
};

// ---------- Request bodies ----------

export const turnRequestSchema = z.object(sessionCore).refine(
  (b) => b.turns.length === 0 || Boolean(b.turns[b.turns.length - 1].answer),
  { message: "Answer the current question first", path: ["turns"] },
);

export const offersRequestSchema = z.object(sessionCore);

export const negotiateRequestSchema = z.object({
  pitch: pitchSchema,
  offer: offerSchema,
  counter: termsSchema,
  counters: z.number().int().min(0).max(2),
});

export const debriefRequestSchema = z.object({ ...sessionCore, deal: dealSchema.nullable() });

// ---------- Gemini structured outputs (also the runtime validators for them) ----------

const aiQuestion = z.object({
  sharkId: sharkIdSchema,
  question: z.string(),
  probing: dimensionSchema,
});

const aiEvaluation = z.object({
  quality: z.number(),
  vague: z.boolean(),
  reactions: z.array(z.object({ sharkId: sharkIdSchema, delta: z.number(), line: z.string() })),
});

export const aiOpeningSchema = z.object({ next: aiQuestion });
export const aiTurnSchema = z.object({ evaluation: aiEvaluation, next: aiQuestion });
export const aiFinalTurnSchema = z.object({ evaluation: aiEvaluation });

export const aiOffersSchema = z.object({
  offers: z.array(
    z.object({
      sharkId: sharkIdSchema,
      amountLakh: z.number(),
      equityPct: z.number(),
      condition: z.string(),
      line: z.string(),
    }),
  ),
  outs: z.array(z.object({ sharkId: sharkIdSchema, reason: z.string() })),
});

export const aiNegotiateSchema = z.object({
  response: z.enum(["accept", "counter", "walk"]),
  amountLakh: z.number(),
  equityPct: z.number(),
  line: z.string(),
});

const score = z.number().min(0).max(10);
export const debriefSchema = z.object({
  overall: z.number().min(0).max(100),
  verdict: z.string(),
  scores: z.object({
    economics: score,
    customer: score,
    defensibility: score,
    founder: score,
    market: score,
    answers: score,
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  toughestMoment: z.object({ question: z.string(), yourAnswer: z.string(), betterAnswer: z.string() }),
  sharkWishes: z.array(z.object({ sharkId: sharkIdSchema, wanted: z.string() })),
  improvedPitch: z.string(),
  fixes: z.array(z.string()),
});
