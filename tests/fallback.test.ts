import { describe, expect, it } from "vitest";
import { fallbackDebrief, fallbackEvaluation, fallbackOffers, fallbackQuestion, scoreAnswer } from "@/lib/fallback";
import { debriefSchema } from "@/lib/schemas";
import { SHARKS } from "@/lib/sharks";
import { makePitch, makeSharks, makeTurn } from "./helpers";

describe("fallbackQuestion", () => {
  it("never repeats a question already asked", () => {
    const first = fallbackQuestion("vikram", [], false);
    const second = fallbackQuestion("vikram", [{ ...first, answer: "x" }], false);
    expect(second.question).not.toBe(first.question);
    expect(second.probing).toBe("economics");
  });

  it("uses the shark's follow-up line when pressing", () => {
    expect(fallbackQuestion("meera", [], true)).toMatchObject({ question: SHARKS.meera.followUp, isFollowUp: true });
  });
});

describe("scoreAnswer", () => {
  it("rewards concrete evidence and punishes hedging", () => {
    expect(scoreAnswer("We have 120 paying customers at Rs 499 a month with a 62% gross margin, and churn is 3% monthly.")).toBeGreaterThanOrEqual(4);
    expect(scoreAnswer("Not sure, maybe lots of people")).toBe(1);
  });
});

describe("fallbackEvaluation", () => {
  it("moves the asker most and marks short answers vague", () => {
    const evaluation = fallbackEvaluation("not sure", makeSharks(), "arjun");
    const arjun = evaluation.reactions.find((r) => r.sharkId === "arjun");
    const zara = evaluation.reactions.find((r) => r.sharkId === "zara");
    expect(evaluation.vague).toBe(true);
    expect(arjun!.delta).toBeLessThan(zara!.delta);
  });
});

describe("fallbackOffers", () => {
  it("only eligible sharks offer and everyone else gives a reason", () => {
    const sharks = makeSharks("realistic", { meera: 80, zara: 60 });
    sharks.arjun.status = "out";
    sharks.arjun.outReason = "No moat.";
    const { offers, outs } = fallbackOffers(makePitch(), sharks);
    expect(offers.map((o) => o.sharkId)).toEqual(["meera", "zara"]);
    expect(offers[0].equityPct).toBeGreaterThanOrEqual(10);
    expect(outs.find((o) => o.sharkId === "arjun")?.reason).toBe("No moat.");
    expect(outs).toHaveLength(2);
  });
});

describe("fallbackDebrief", () => {
  it("returns a complete debrief that passes the schema", () => {
    const turns = [makeTurn("vikram", "Not sure", { quality: 1 }), makeTurn("meera", "120 customers pay Rs 499", { quality: 4, probing: "customer" })];
    const debrief = fallbackDebrief(makePitch(), makeSharks(), turns, null);
    expect(debriefSchema.safeParse(debrief).success).toBe(true);
    expect(debrief.toughestMoment.yourAnswer).toBe("Not sure");
    expect(debrief.improvedPitch).toContain("[your");
    expect(debrief.fixes).toHaveLength(3);
  });

  it("mentions the deal when one was closed", () => {
    const debrief = fallbackDebrief(makePitch(), makeSharks(), [], { sharkId: "zara", amountLakh: 50, equityPct: 12 });
    expect(debrief.verdict).toContain("Zara Khan");
  });
});
