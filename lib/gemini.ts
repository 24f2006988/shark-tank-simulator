import "server-only";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { log } from "./log";

export const DEFAULT_MODEL = "gemini-3.5-flash";
export const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash-lite";
export const TIMEOUT_MS = 12_000;

export class GeminiError extends Error {}

export interface GenerateOptions {
  system: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
}

let client: { key: string; ai: GoogleGenAI } | null = null;

function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set");
  if (client?.key !== key) client = { key, ai: new GoogleGenAI({ apiKey: key }) };
  return client.ai;
}

export function models(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const backup = process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK_MODEL;
  return primary === backup ? [primary] : [primary, backup];
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
 * schema. Tries the primary model, then the lighter fallback model, each with a timeout.
 */
export async function generateJson<T>(schema: z.ZodType<T>, opts: GenerateOptions): Promise<{ data: T; model: string }> {
  const ai = getClient();
  let lastError: unknown;
  for (const model of models()) {
    const started = Date.now();
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
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      });
      const parsed = schema.safeParse(JSON.parse(res.text ?? ""));
      if (!parsed.success) throw new GeminiError("Reply did not match the schema");
      return { data: parsed.data, model };
    } catch (err) {
      lastError = err;
      log("WARNING", "gemini_attempt_failed", {
        model,
        ms: Date.now() - started,
        reason: err instanceof Error ? err.name : "unknown",
        status: typeof err === "object" && err && "status" in err ? Number(err.status) : 0,
      });
    }
  }
  throw new GeminiError(lastError instanceof Error ? lastError.message : "All Gemini models failed");
}
