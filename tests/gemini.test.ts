import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const generateContent = vi.fn();
const constructed: unknown[] = [];
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
    constructor(opts: unknown) {
      constructed.push(opts);
    }
  },
  ThinkingLevel: { LOW: "LOW" },
}));

const { generateJson, GeminiError, models, resetCooldowns, DEFAULT_MODELS } = await import("@/lib/gemini");

const schema = z.object({ question: z.string() });
const opts = { system: "s", prompt: "p", temperature: 0.5, maxTokens: 100 };
const apiError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { name: "ApiError", status });

describe("generateJson", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODELS", "primary,backup");
    vi.stubEnv("GEMINI_USE_VERTEX", "");
    generateContent.mockReset();
    resetCooldowns();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns validated JSON from the first model with a JSON schema attached", async () => {
    generateContent.mockResolvedValue({ text: '{"question":"How much?"}' });
    await expect(generateJson(schema, opts)).resolves.toEqual({ data: { question: "How much?" }, model: "primary" });
    const call = generateContent.mock.calls[0][0];
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.responseJsonSchema).toMatchObject({ type: "object", required: ["question"] });
    expect(call.config.responseJsonSchema).not.toHaveProperty("$schema");
  });

  it("moves to the next model on an error or a reply that breaks the schema", async () => {
    generateContent.mockRejectedValueOnce(apiError(500));
    generateContent.mockResolvedValueOnce({ text: '{"question":"Second?"}' });
    await expect(generateJson(schema, opts)).resolves.toMatchObject({ model: "backup" });

    generateContent.mockResolvedValueOnce({ text: '{"wrong":1}' });
    generateContent.mockResolvedValueOnce({ text: '{"question":"Third?"}' });
    await expect(generateJson(schema, opts)).resolves.toMatchObject({ model: "backup" });
  });

  it("skips a model that hit its quota until the cooldown ends", async () => {
    let t = 0;
    const clock = () => t;
    generateContent.mockRejectedValueOnce(apiError(429));
    generateContent.mockResolvedValue({ text: '{"question":"ok"}' });
    await generateJson(schema, opts, clock);
    generateContent.mockClear();

    await expect(generateJson(schema, opts, clock)).resolves.toMatchObject({ model: "backup" });
    expect(generateContent).toHaveBeenCalledTimes(1);

    t += 11 * 60_000;
    await expect(generateJson(schema, opts, clock)).resolves.toMatchObject({ model: "primary" });
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

  it("uses Vertex AI with the project's service account when enabled", async () => {
    vi.stubEnv("GEMINI_USE_VERTEX", "true");
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "my-project");
    generateContent.mockResolvedValue({ text: '{"question":"ok"}' });
    await generateJson(schema, opts);
    expect(constructed.at(-1)).toEqual({ vertexai: true, project: "my-project", location: "global" });
  });

  it("uses the default list without duplicates", () => {
    vi.stubEnv("GEMINI_MODELS", "");
    expect(models()).toEqual(DEFAULT_MODELS);
    vi.stubEnv("GEMINI_MODELS", "a, a ,b");
    expect(models()).toEqual(["a", "b"]);
  });
});
