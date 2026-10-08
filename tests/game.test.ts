import { describe, expect, it } from "vitest";
import {
  DIFFICULTY,
  activeSharks,
  applyReactions,
  applyWalkouts,
  capBystanders,
  clampDelta,
  createSharks,
  eligibleForOffer,
  fallbackNegotiate,
  followUpCandidate,
  formatInr,
  impliedValuationLakh,
  isQuestioningOver,
  pickNextAsker,
  sanitizeOffer,
  streak,
} from "@/lib/game";
import { makePitch, makeSharks, makeTurn } from "./helpers";

describe("createSharks", () => {
  it.each(["explore", "friendly", "realistic", "ruthless"] as const)("starts every shark in with the %s interest", (d) => {
    const sharks = createSharks(d);
    expect(activeSharks(sharks)).toHaveLength(4);
    expect(Object.values(sharks).every((s) => s.interest === DIFFICULTY[d].startInterest)).toBe(true);
  });
});

describe("applyReactions", () => {
  it("clamps deltas to +/-20 and interest to 0-100", () => {
    const sharks = makeSharks("realistic", { vikram: 95, meera: 5 });
    const next = applyReactions(sharks, [
      { sharkId: "vikram", delta: 50, line: "" },
      { sharkId: "meera", delta: -50, line: "" },
    ], "realistic");
    expect(next.vikram.interest).toBe(100);
    expect(next.meera.interest).toBe(0);
  });

  it("scales negative deltas by difficulty", () => {
    expect(clampDelta(-10, "explore")).toBe(-2);
    expect(clampDelta(-10, "friendly")).toBe(-6);
    expect(clampDelta(-10, "ruthless")).toBe(-14);
    expect(clampDelta(10, "ruthless")).toBe(10);
  });

  it("ignores sharks who are out and does not mutate the input", () => {
    const sharks = makeSharks();
    sharks.arjun.status = "out";
    const next = applyReactions(sharks, [{ sharkId: "arjun", delta: 20, line: "" }], "realistic");
    expect(next.arjun.interest).toBe(50);
    expect(sharks.arjun.interest).toBe(50);
  });
});

describe("capBystanders", () => {
  it("limits only the reactions of sharks who did not ask", () => {
    const capped = capBystanders([
      { sharkId: "vikram", delta: -20, line: "" },
      { sharkId: "meera", delta: -20, line: "" },
      { sharkId: "zara", delta: 15, line: "" },
    ], "vikram");
    expect(capped.map((r) => r.delta)).toEqual([-20, -6, 6]);
  });
});

describe("applyWalkouts", () => {
  it("lets nobody leave during the grace period", () => {
    const sharks = makeSharks("realistic", { vikram: 5 });
    const { walkouts } = applyWalkouts(sharks, [makeTurn("vikram", "meh")], "realistic");
    expect(walkouts).toEqual([]);
  });

  it("removes sharks below the threshold with their reason", () => {
    const sharks = makeSharks("realistic", { vikram: 10 });
    const turns = [makeTurn("vikram", "a"), makeTurn("meera", "b")];
    const result = applyWalkouts(sharks, turns, "realistic", { vikram: "Numbers don't add up. I'm out." });
    expect(result.walkouts).toEqual([{ sharkId: "vikram", reason: "Numbers don't add up. I'm out." }]);
    expect(result.sharks.vikram.status).toBe("out");
  });

  it("keeps the most interested shark when everyone would leave early", () => {
    const sharks = makeSharks("realistic", { vikram: 1, meera: 2, arjun: 3, zara: 4 });
    const turns = [makeTurn("vikram", "a"), makeTurn("meera", "b")];
    const result = applyWalkouts(sharks, turns, "realistic");
    expect(activeSharks(result.sharks)).toEqual(["zara"]);
    expect(result.walkouts[0].reason).toMatch(/out/i);
  });
});

describe("applyWalkouts after the fair-hearing period", () => {
  it("lets the whole panel leave once enough answers are in, which ends questioning", () => {
    const sharks = makeSharks("ruthless", { vikram: 1, meera: 2, arjun: 3, zara: 4 });
    const turns = ["a", "b", "c", "d"].map((a) => makeTurn("meera", a));
    const result = applyWalkouts(sharks, turns, "ruthless");
    expect(activeSharks(result.sharks)).toEqual([]);
    expect(isQuestioningOver(result.sharks, turns, "ruthless")).toBe(true);
  });
});

describe("pickNextAsker", () => {
  it("gives a vague answer a follow-up from the same shark", () => {
    const turns = [makeTurn("meera", "we have lots of users")];
    expect(pickNextAsker(makeSharks(), turns, true)).toEqual({ sharkId: "meera", isFollowUp: true });
  });

  it("caps follow-ups at two in a row", () => {
    const turns = [makeTurn("meera", "a"), makeTurn("meera", "b"), makeTurn("meera", "c")];
    expect(streak(turns, "meera")).toBe(3);
    expect(followUpCandidate(makeSharks(), turns)).toBeNull();
    expect(pickNextAsker(makeSharks(), turns, true).sharkId).not.toBe("meera");
  });

  it("rotates to the shark who has asked least, ties going to the least interested", () => {
    const turns = [makeTurn("vikram", "a")];
    const sharks = makeSharks("realistic", { arjun: 30 });
    expect(pickNextAsker(sharks, turns, false)).toEqual({ sharkId: "arjun", isFollowUp: false });
  });

  it("skips sharks who are out", () => {
    const sharks = makeSharks();
    sharks.vikram.status = "out";
    expect(pickNextAsker(sharks, [], false).sharkId).toBe("meera");
  });

  it("does not follow up for a shark who walked out", () => {
    const sharks = makeSharks();
    sharks.meera.status = "out";
    expect(pickNextAsker(sharks, [makeTurn("meera", "x")], true).isFollowUp).toBe(false);
  });
});

describe("end of questioning and offers", () => {
  it("ends after the difficulty's max answers or when all sharks are out", () => {
    const turns = Array.from({ length: DIFFICULTY.realistic.maxAnswers }, () => makeTurn("vikram", "a"));
    expect(isQuestioningOver(makeSharks(), turns, "realistic")).toBe(true);
    expect(isQuestioningOver(makeSharks(), turns.slice(1), "realistic")).toBe(false);
    const allOut = makeSharks();
    for (const s of Object.values(allOut)) s.status = "out";
    expect(isQuestioningOver(allOut, [], "realistic")).toBe(true);
  });

  it("only sharks above the offer threshold may offer", () => {
    const sharks = makeSharks("realistic", { vikram: 80, meera: 54, arjun: 55, zara: 90 });
    sharks.zara.status = "out";
    expect(eligibleForOffer(sharks, "realistic")).toEqual(["vikram", "arjun"]);
  });
});

describe("money", () => {
  it("computes implied valuation and formats lakh and crore", () => {
    expect(impliedValuationLakh(50, 10)).toBe(500);
    expect(formatInr(50)).toBe("Rs 50 lakh");
    expect(formatInr(500)).toBe("Rs 5 crore");
    expect(formatInr(250)).toBe("Rs 2.5 crore");
  });

  it("sanitizes offers into sensible ranges", () => {
    const pitch = makePitch({ askLakh: 50 });
    const offer = sanitizeOffer({ sharkId: "vikram", amountLakh: 999, equityPct: 0.1, condition: "  ", line: "x" }, pitch);
    expect(offer.amountLakh).toBe(100);
    expect(offer.equityPct).toBe(1);
    expect(offer.condition).toBeUndefined();
  });
});

describe("fallbackNegotiate", () => {
  const offer = { sharkId: "meera" as const, amountLakh: 50, equityPct: 20, line: "" };

  it("accepts a counter within the difficulty's gap", () => {
    expect(fallbackNegotiate(offer, { amountLakh: 50, equityPct: 19 }, 0, "realistic").response).toBe("accept");
  });

  it("meets in the middle for a moderate gap", () => {
    const res = fallbackNegotiate(offer, { amountLakh: 50, equityPct: 16 }, 0, "realistic");
    expect(res.response).toBe("counter");
    expect(res.equityPct).toBeGreaterThan(16);
    expect(res.equityPct).toBeLessThan(20);
  });

  it("walks away from a big gap or after two counters", () => {
    expect(fallbackNegotiate(offer, { amountLakh: 50, equityPct: 5 }, 0, "realistic").response).toBe("walk");
    expect(fallbackNegotiate(offer, { amountLakh: 50, equityPct: 16 }, 2, "realistic").response).toBe("walk");
  });
});
