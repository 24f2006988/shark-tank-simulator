import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const generateContent = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  ThinkingLevel: { LOW: "LOW" },
}));

const { generateJson, GeminiError, models } = await import("@/lib/gemini");

const schema = z.object({ question: z.string() });
const opts = { system: "s", prompt: "p", temperature: 0.5, maxTokens: 100 };

describe("generateJson", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL", "primary");
    vi.stubEnv("GEMINI_FALLBACK_MODEL", "backup");
    generateContent.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns validated JSON from the primary model with a JSON schema attached", async () => {
    generateContent.mockResolvedValue({ text: '{"question":"How much?"}' });
    await expect(generateJson(schema, opts)).resolves.toEqual({ data: { question: "How much?" }, model: "primary" });
    const call = generateContent.mock.calls[0][0];
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.responseJsonSchema).toMatchObject({ type: "object", required: ["question"] });
    expect(call.config.responseJsonSchema).not.toHaveProperty("$schema");
  });

  it("falls back to the second model on an error or a reply that breaks the schema", async () => {
    generateContent.mockRejectedValueOnce(Object.assign(new Error("overloaded"), { status: 503 }));
    generateContent.mockResolvedValueOnce({ text: '{"question":"Second?"}' });
    await expect(generateJson(schema, opts)).resolves.toMatchObject({ model: "backup" });

    generateContent.mockResolvedValueOnce({ text: '{"wrong":1}' });
    generateContent.mockResolvedValueOnce({ text: '{"question":"Third?"}' });
    await expect(generateJson(schema, opts)).resolves.toMatchObject({ model: "backup" });
  });

  it("throws GeminiError when every model fails or the reply is not JSON", async () => {
    generateContent.mockResolvedValue({ text: "not json" });
    await expect(generateJson(schema, opts)).rejects.toBeInstanceOf(GeminiError);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("throws without calling Gemini when the key is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(generateJson(schema, opts)).rejects.toThrow(/GEMINI_API_KEY/);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("does not try the same model twice", () => {
    vi.stubEnv("GEMINI_FALLBACK_MODEL", "primary");
    expect(models()).toEqual(["primary"]);
  });
});
