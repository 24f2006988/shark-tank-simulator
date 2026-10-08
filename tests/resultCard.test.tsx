// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultCard } from "@/components/ResultCard";
import { outcomeLine, resultCardText } from "@/components/resultText";
import type { Debrief, Deal, Pitch } from "@/lib/types";

afterEach(cleanup);

const pitch: Pitch = { ideaName: "ChaiBot", oneLiner: "", askLakh: 50, equityPct: 10, description: "A chai robot for offices.", difficulty: "realistic" };
const debrief: Debrief = {
  overall: 72,
  verdict: "Credible.",
  scores: { economics: 8, customer: 7, defensibility: 4, founder: 8, market: 6, answers: 7 },
  strengths: [],
  weaknesses: [],
  toughestMoment: { question: "What stops a copycat?", yourAnswer: "We are faster.", betterAnswer: "Contracts." },
  sharkWishes: [],
  improvedPitch: "ChaiBot brews chai.",
  fixes: ["Name your moat", "Lead with renewals"],
};
const deal: Deal = { sharkId: "vikram", amountLakh: 50, equityPct: 10 };

describe("result card text", () => {
  it("summarises offers and the deal in one line", () => {
    expect(outcomeLine(deal, 2)).toBe("2 offers, 1 deal: Vikram Rao, Rs 50 lakh for 10%");
    expect(outcomeLine(null, 0)).toBe("0 offers, no deal");
    expect(outcomeLine(null, 1)).toBe("1 offer, no deal");
  });

  it("builds a short card with the score, outcome, toughest question and first fix", () => {
    const text = resultCardText(debrief, pitch, deal, 2);
    expect(text).toContain("Shark Tank Simulator: ChaiBot");
    expect(text).toContain("Score 72/100");
    expect(text).toContain("Result: 2 offers, 1 deal: Vikram Rao, Rs 50 lakh for 10%.");
    expect(text).toContain('Toughest question: "What stops a copycat?"');
    expect(text).toContain("Fix first: Name your moat");
    expect(text).not.toContain("Lead with renewals");
  });
});

describe("ResultCard", () => {
  it("shows the ask and the outcome as a labelled list (the score ring beside it shows the score)", () => {
    render(<ResultCard debrief={debrief} pitch={pitch} deal={deal} offerCount={2} />);
    expect(screen.getByRole("heading", { name: "Your result card" })).toBeTruthy();
    expect(screen.getAllByRole("term").map((t) => t.textContent)).toEqual(["The ask", "Outcome"]);
    expect(screen.getByText("2 offers, 1 deal: Vikram Rao, Rs 50 lakh for 10%")).toBeTruthy();
  });

  it("copies the card and announces it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<ResultCard debrief={debrief} pitch={pitch} deal={deal} offerCount={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy result card" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Copied to clipboard"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Score 72/100"));
    vi.unstubAllGlobals();
  });
});
