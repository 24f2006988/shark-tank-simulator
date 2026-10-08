import { describe, expect, it } from "vitest";
import { blipFor } from "@/components/mumble";

describe("blipFor", () => {
  it("is silent on spaces and punctuation", () => {
    expect(blipFor("meera", " ", 0, "Hi there.")).toBeNull();
    expect(blipFor("meera", ".", 8, "Hi there.")).toBeNull();
  });

  it("gives each shark a distinct pitch for the same letter", () => {
    const freqs = (["vikram", "arjun", "meera", "zara"] as const).map((id) => blipFor(id, "b", 0, "b")?.freq);
    expect(new Set(freqs).size).toBe(4);
  });

  it("is deterministic, so a word always sounds the same", () => {
    expect(blipFor("arjun", "k", 3, "market")).toEqual(blipFor("arjun", "k", 3, "market"));
  });

  it("raises the pitch at the end of a question", () => {
    const text = "Who pays you";
    const flat = blipFor("zara", "u", text.length - 1, text)!.freq;
    const rising = blipFor("zara", "u", text.length - 1, `${text}?`)!.freq;
    expect(rising).toBeGreaterThan(flat);
  });
});
