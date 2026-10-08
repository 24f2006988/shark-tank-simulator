// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Debrief } from "@/components/Debrief";
import type { Debrief as DebriefData } from "@/lib/types";
import { makePitch } from "./helpers";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
  HTMLElement.prototype.animate = vi.fn();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Debrief download", () => {
  const debrief: DebriefData = {
    overall: 55,
    verdict: "Promising, but prove demand.",
    scores: { economics: 6, customer: 4, defensibility: 5, founder: 7, market: 6, answers: 5 },
    strengths: ["Clear margins"],
    weaknesses: ["No named customers"],
    toughestMoment: { question: "Who pays today?", yourAnswer: "Offices.", betterAnswer: "Infosys Block C, 300 cups a day." },
    sharkWishes: [],
    improvedPitch: "ChaiCart sells 1,200 cups a day.",
    fixes: ["Name three paying offices"],
  };

  it("saves the whole feedback as a named text file", async () => {
    let saved: Blob | undefined;
    const createObjectURL = vi.fn((b: Blob) => {
      saved = b;
      return "blob:feedback";
    });
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("chaicart-feedback.txt");
    });

    render(<Debrief debrief={debrief} pitch={makePitch()} deal={{ sharkId: "zara", amountLakh: 40, equityPct: 15 }} onPitchAgain={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Download feedback (.txt)" }));

    expect(click).toHaveBeenCalledOnce();
    const text = await saved!.text();
    expect(text).toContain("Overall: 55/100. Promising, but prove demand.");
    expect(text).toContain("Deal: Zara Khan, Rs 40 lakh for 15%");
    expect(text).toContain("- No named customers");
    expect(text).toContain("Better answer: Infosys Block C, 300 cups a day.");
    expect(text).toContain("Improved pitch:\nChaiCart sells 1,200 cups a day.");
    expect(screen.getByText("Promising, with gaps")).toBeTruthy();
  });
});
