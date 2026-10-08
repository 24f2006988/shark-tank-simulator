/**
 * Plain constants shared by client and server. Kept free of Zod so client components that only need
 * ids or limits don't pull the validation library into the browser bundle.
 */
export const SHARK_IDS = ["vikram", "meera", "arjun", "zara"] as const;
export const DIMENSIONS = ["economics", "customer", "defensibility", "founder", "market"] as const;
export const DIFFICULTIES = ["friendly", "realistic", "ruthless"] as const;

export const LIMITS = {
  ideaName: { min: 3, max: 80 },
  oneLiner: { max: 140 },
  description: { min: 40, max: 2000 },
  answer: { max: 1200 },
  question: { max: 300 },
  line: { max: 240 },
  turns: 12,
  bodyBytes: 32_000,
} as const;
