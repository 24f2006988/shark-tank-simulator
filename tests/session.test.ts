import { describe, expect, it } from "vitest";
import { answeredTurns, createSession, parsePrefill, sessionReducer } from "@/lib/session";
import type { Pitch } from "@/lib/types";

const testPitch: Pitch = {
  ideaName: "ChaiCart",
  oneLiner: "Hot chai delivered to offices",
  askLakh: 50,
  equityPct: 10,
  description: "We run e-bike chai carts around tech parks in Bengaluru for offices.",
  difficulty: "realistic",
};

describe("sessionReducer and session helpers", () => {
  it("initializes a clean session with createSession", () => {
    const s = createSession(testPitch);
    expect(s.pitch).toEqual(testPitch);
    expect(s.stage).toBe("questioning");
    expect(s.over).toBe(false);
    expect(s.turns).toHaveLength(0);
    expect(s.sharks.vikram.interest).toBe(50);
  });

  it("handles question action", () => {
    const s = createSession(testPitch);
    const s2 = sessionReducer(s, {
      type: "question",
      next: { sharkId: "vikram", question: "What is your CAC?", probing: "economics", isFollowUp: false },
    });
    expect(s2.turns).toHaveLength(1);
    expect(s2.turns[0].question).toBe("What is your CAC?");
  });

  it("handles answered action and records walkouts", () => {
    let s = createSession(testPitch);
    s = sessionReducer(s, {
      type: "question",
      next: { sharkId: "vikram", question: "What is your CAC?", probing: "economics", isFollowUp: false },
    });

    const s2 = sessionReducer(s, {
      type: "answered",
      answer: "Rs 450",
      result: {
        evaluation: {
          quality: 4,
          vague: false,
          reactions: [{ sharkId: "vikram", delta: 10, line: "Solid." }],
          walkouts: [{ sharkId: "arjun", reason: "Too crowded." }],
        },
        sharks: {
          ...s.sharks,
          vikram: { ...s.sharks.vikram, interest: 60 },
          arjun: { ...s.sharks.arjun, status: "out" },
        },
        next: { sharkId: "meera", question: "Who pays?", probing: "customer", isFollowUp: false },
        over: false,
      },
    });

    expect(s2.turns).toHaveLength(2);
    expect(s2.turns[0].answer).toBe("Rs 450");
    expect(s2.turns[0].quality).toBe(4);
    expect(s2.walkouts).toHaveLength(1);
    expect(s2.walkouts[0].sharkId).toBe("arjun");
    expect(answeredTurns(s2.turns)).toHaveLength(1);
  });

  it("handles offers action", () => {
    const s = createSession(testPitch);
    const s2 = sessionReducer(s, {
      type: "offers",
      result: {
        offers: [{ sharkId: "meera", amountLakh: 50, equityPct: 15, line: "I will help with distribution." }],
        outs: [{ sharkId: "vikram", reason: "Valuation too high." }],
      },
    });

    expect(s2.stage).toBe("deal");
    expect(s2.offers).toHaveLength(1);
    expect(s2.talks.meera?.status).toBe("open");
    expect(s2.talks.meera?.log).toHaveLength(1);
  });

  it("handles accepting an offer", () => {
    let s = createSession(testPitch);
    s = sessionReducer(s, {
      type: "offers",
      result: {
        offers: [{ sharkId: "meera", amountLakh: 50, equityPct: 15, line: "I love the product." }],
        outs: [],
      },
    });

    const s2 = sessionReducer(s, { type: "accept", sharkId: "meera" });
    expect(s2.stage).toBe("debrief");
    expect(s2.deal).toEqual({ sharkId: "meera", amountLakh: 50, equityPct: 15, condition: undefined });
    expect(s2.talks.meera?.status).toBe("accepted");
  });

  it("handles declining an offer", () => {
    let s = createSession(testPitch);
    s = sessionReducer(s, {
      type: "offers",
      result: {
        offers: [{ sharkId: "meera", amountLakh: 50, equityPct: 15, line: "I love the product." }],
        outs: [],
      },
    });

    const s2 = sessionReducer(s, { type: "decline", sharkId: "meera" });
    expect(s2.talks.meera?.status).toBe("declined");
  });

  it("handles countering with shark walk or acceptance", () => {
    let s = createSession(testPitch);
    s = sessionReducer(s, {
      type: "offers",
      result: {
        offers: [{ sharkId: "meera", amountLakh: 50, equityPct: 20, line: "First offer." }],
        outs: [],
      },
    });

    // Shark counter
    const s2 = sessionReducer(s, {
      type: "countered",
      sharkId: "meera",
      counter: { amountLakh: 50, equityPct: 12 },
      result: { response: "counter", amountLakh: 50, equityPct: 15, line: "Meet in middle." },
    });
    expect(s2.talks.meera?.status).toBe("open");
    expect(s2.talks.meera?.counters).toBe(1);
    expect(s2.offers[0].equityPct).toBe(15);

    // Shark accepts counter
    const s3 = sessionReducer(s2, {
      type: "countered",
      sharkId: "meera",
      counter: { amountLakh: 50, equityPct: 14 },
      result: { response: "accept", amountLakh: 50, equityPct: 14, line: "Deal!" },
    });
    expect(s3.stage).toBe("debrief");
    expect(s3.deal?.equityPct).toBe(14);
  });

  it("handles toDebrief and debrief actions", () => {
    let s = createSession(testPitch);
    s = sessionReducer(s, { type: "toDebrief" });
    expect(s.stage).toBe("debrief");

    const debrief = {
      overall: 82,
      verdict: "Strong presentation.",
      scores: { economics: 8, customer: 8, defensibility: 7, founder: 9, market: 8, answers: 8 },
      strengths: ["Great unit economics"],
      weaknesses: ["Competitive moat needs work"],
      toughestMoment: { question: "CAC?", yourAnswer: "Rs 450", betterAnswer: "Blended Rs 450" },
      sharkWishes: [{ sharkId: "vikram" as const, wanted: "More data" }],
      improvedPitch: "Better pitch text",
      fixes: ["Prove moat"],
    };
    const s2 = sessionReducer(s, { type: "debrief", debrief });
    expect(s2.debrief?.overall).toBe(82);
  });

  it("parses prefill cleanly", () => {
    expect(parsePrefill(null)).toBeNull();
    expect(parsePrefill("not json")).toBeNull();
    const parsed = parsePrefill(JSON.stringify(testPitch));
    expect(parsed?.ideaName).toBe("ChaiCart");
  });
});
