import "server-only";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { log } from "./log";

/**
 * Tried in order. Free-tier quotas are per model per day (gemini-3.5-flash allows only 20 requests),
 * so spreading calls across several fast models keeps the panel answering under load.
 */
// Measured on Vertex AI: flash-lite answers a turn in about 3 s; gemini-3.1-flash-lite returned 429 on every call, so it is left out.
export const DEFAULT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];
export const ATTEMPT_TIMEOUT_MS = 13_000;
/** Total time a request may spend across all models before the caller uses its scripted fallback (the client waits 45 s). */
export const BUDGET_MS = 26_000;
/**
 * How long a model is skipped after a 429 or 503. Free-tier 429s mean the daily quota is gone; on Vertex AI
 * they are short per-minute throttling, so a long cooldown would only push traffic onto slower models.
 */
export function cooldownMs(status: 429 | 503): number {
  if (status === 503) return 30_000;
  return process.env.GEMINI_USE_VERTEX === "true" ? 20_000 : 10 * 60_000;
}

export class GeminiError extends Error {}

export interface GenerateOptions {
  system: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  /** Per-attempt and total time limits; long replies such as the debrief need more than a turn. */
  attemptMs?: number;
  budgetMs?: number;
}

let client: { id: string; ai: GoogleGenAI } | null = null;

/**
 * API key (Gemini Developer API) by default. With GEMINI_USE_VERTEX=true the Cloud Run service
 * account calls Vertex AI instead: no key at all, billed to the Google Cloud project.
 */
function getClient(): GoogleGenAI {
  if (process.env.GEMINI_USE_VERTEX === "true") {
    const project = process.env.GOOGLE_CLOUD_PROJECT?.trim();
    if (!project) throw new GeminiError("GOOGLE_CLOUD_PROJECT is not set");
    const location = process.env.GOOGLE_CLOUD_LOCATION?.trim() || "global";
    const id = `vertex:${project}:${location}`;
    if (client?.id !== id) client = { id, ai: new GoogleGenAI({ vertexai: true, project, location }) };
    return client.ai;
  }
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set");
  if (client?.id !== key) client = { id: key, ai: new GoogleGenAI({ apiKey: key }) };
  return client.ai;
}

export function models(): string[] {
  const list = process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean);
  return [...new Set(list?.length ? list : DEFAULT_MODELS)];
}

/** Models that recently returned 429 or 503 are skipped until this time. */
const coolingUntil = new Map<string, number>();

export function resetCooldowns(): void {
  coolingUntil.clear();
}

function statusOf(err: unknown): number {
  return typeof err === "object" && err && "status" in err ? Number(err.status) : 0;
}

const jsonSchemaCache = new WeakMap<z.ZodType, unknown>();

function toJsonSchema(schema: z.ZodType): unknown {
  let json = jsonSchemaCache.get(schema);
  if (!json) {
    const full = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
    delete full.$schema; // Gemini rejects the meta-schema key
    json = full;
    jsonSchemaCache.set(schema, json);
  }
  return json;
}

/**
 * Calls Gemini with a JSON schema derived from `schema` and validates the reply with the same
 * schema. Walks the model list (skipping models cooling down after 429/503) within a time budget.
 */
export async function generateJson<T>(schema: z.ZodType<T>, opts: GenerateOptions, now: () => number = Date.now): Promise<{ data: T; model: string }> {
  const ai = getClient();
  const deadline = now() + (opts.budgetMs ?? BUDGET_MS);
  const ready = models().filter((m) => (coolingUntil.get(m) ?? 0) <= now());
  // If every model is cooling down, try them anyway: a likely-throttled model beats a scripted reply.
  const available = ready.length ? ready : models();
  let lastError: unknown = new GeminiError("No Gemini model answered in time");
  for (const model of available) {
    const remaining = deadline - now();
    if (remaining < 2_000) break;
    const started = now();
    try {
      const res = await ai.models.generateContent({
        model,
        contents: opts.prompt,
        config: {
          systemInstruction: opts.system,
          temperature: opts.temperature,
          maxOutputTokens: opts.maxTokens,
          responseMimeType: "application/json",
          responseJsonSchema: toJsonSchema(schema),
          // Low thinking keeps a turn to a few seconds; the prompts carry the reasoning rules.
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: AbortSignal.timeout(Math.min(opts.attemptMs ?? ATTEMPT_TIMEOUT_MS, remaining)),
        },
      });
      const parsed = schema.safeParse(JSON.parse(res.text ?? ""));
      if (!parsed.success) throw new GeminiError("Reply did not match the schema");
      return { data: parsed.data, model };
    } catch (err) {
      lastError = err;
      const status = statusOf(err);
      if (status === 429 || status === 503) coolingUntil.set(model, now() + cooldownMs(status));
      log("WARNING", "gemini_attempt_failed", {
        model,
        ms: now() - started,
        reason: err instanceof Error ? err.name : "unknown",
        status,
      });
    }
  }
  throw new GeminiError(lastError instanceof Error ? lastError.message : "All Gemini models failed");
}
