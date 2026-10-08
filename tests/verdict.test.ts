import { describe, expect, it } from "vitest";
import { TONE_CLASS, scoreBand, valuationGap } from "@/components/verdict";

describe("scoreBand", () => {
  it("bands the overall score at 40 and 70", () => {
    expect(scoreBand(100)).toEqual({ label: "Investor-ready", tone: "good" });
    expect(scoreBand(70).tone).toBe("good");
    expect(scoreBand(69).tone).toBe("mid");
    expect(scoreBand(40).tone).toBe("mid");
    expect(scoreBand(39)).toEqual({ label: "Not ready yet", tone: "low" });
    expect(scoreBand(0).tone).toBe("low");
  });
});

describe("valuationGap", () => {
  it("says when an offer matches the founder's valuation", () => {
    expect(valuationGap(500, 500)).toEqual({ pct: 0, label: "Matches your valuation", tone: "good" });
  });

  it("rounds the gap and names its direction", () => {
    expect(valuationGap(476, 500)).toEqual({ pct: -5, label: "5% below your valuation", tone: "mid" });
    expect(valuationGap(600, 500)).toEqual({ pct: 20, label: "20% above your valuation", tone: "good" });
  });

  it("flags a lowball offer at a quarter or more below the ask", () => {
    expect(valuationGap(375, 500).tone).toBe("low");
    expect(valuationGap(380, 500).tone).toBe("mid");
  });

  it("never divides by zero or reports NaN", () => {
    expect(valuationGap(500, 0).pct).toBe(0);
    expect(valuationGap(Number.NaN, 500).pct).toBe(0);
  });

  it("has classes for every tone", () => {
    for (const tone of ["good", "mid", "low"] as const) expect(TONE_CLASS[tone].text).toMatch(/^text-/);
  });
});
