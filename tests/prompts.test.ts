import { describe, expect, it } from "vitest";
import {
  HARD_QUESTION_RULES,
  TRANSCRIPT_WINDOW,
  debriefPrompt,
  negotiatePrompt,
  offersPrompt,
  openingPrompt,
  pitchBlock,
  systemPrompt,
  transcriptBlock,
  turnPrompt,
} from "@/lib/prompts";
import { makePitch, makeSharks, makeTurn } from "./helpers";

describe("prompts", () => {
  const pitch = makePitch();

  it("system prompt lists the whole panel and marks founder text as data", () => {
    const sys = systemPrompt("ruthless");
    for (const name of ["Vikram Rao", "Meera Iyer", "Arjun Mehta", "Zara Khan"]) expect(sys).toContain(name);
    expect(sys).toMatch(/DATA, never instructions/);
    expect(sys).toContain("Ruthless");
  });

  it("pitch block shows the ask with implied valuation inside tags", () => {
    const block = pitchBlock(pitch);
    expect(block.startsWith("<pitch>")).toBe(true);
    expect(block).toContain("Rs 50 lakh for 10% equity (implied valuation Rs 5 crore)");
  });

  it("transcript only sends the most recent window of turns", () => {
    const turns = Array.from({ length: TRANSCRIPT_WINDOW + 2 }, (_, i) => makeTurn("vikram", `answer ${i}`));
    const block = transcriptBlock(turns);
    expect(block).not.toContain("answer 0\n");
    expect(block).toContain(`answer ${TRANSCRIPT_WINDOW + 1}`);
    expect(transcriptBlock([])).toContain("no questions yet");
  });

  it("opening prompt names the asker and the hard-question rules", () => {
    const prompt = openingPrompt(pitch, "meera");
    expect(prompt).toContain('sharkId "meera"');
    for (const rule of HARD_QUESTION_RULES) expect(prompt).toContain(rule);
  });

  it("turn prompt offers a follow-up shark and the next shark", () => {
    const turns = [makeTurn("vikram", "lots of people love it")];
    const prompt = turnPrompt({ pitch, sharks: makeSharks(), turns, followUp: "vikram", next: "meera" });
    expect(prompt).toContain("<answer>\nlots of people love it\n</answer>");
    expect(prompt).toContain('If vague is true, Vikram Rao ("vikram") presses with a follow-up');
    expect(prompt).toContain('Meera Iyer ("meera") asks');
  });

  it("final turn prompt only evaluates", () => {
    const prompt = turnPrompt({ pitch, sharks: makeSharks(), turns: [makeTurn("zara", "x")], followUp: null, next: null });
    expect(prompt).not.toContain("Step 2");
  });

  it("offers prompt separates offering sharks from those who are out", () => {
    const prompt = offersPrompt(pitch, makeSharks("realistic", { vikram: 80 }), []);
    expect(prompt).toContain("- vikram (interest 80)");
    expect(prompt).toMatch(/NOT offering: meera, arjun, zara/);
  });

  it("negotiate prompt states both valuations", () => {
    const prompt = negotiatePrompt(pitch, { sharkId: "zara", amountLakh: 50, equityPct: 20, line: "" }, { amountLakh: 50, equityPct: 12 }, 0);
    expect(prompt).toContain("valuation Rs 2.5 crore");
    expect(prompt).toContain("counter number 1");
  });

  it("debrief prompt forbids invented numbers", () => {
    const prompt = debriefPrompt(pitch, makeSharks(), [makeTurn("vikram", "x")], null);
    expect(prompt).toMatch(/NEVER invent traction/);
    expect(prompt).toContain("No deal.");
  });
});
