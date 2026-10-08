// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Debrief } from "@/components/Debrief";
import { InterestChart, interestSeries } from "@/components/InterestChart";
import { LandingPreview } from "@/components/LandingPreview";
import type { Debrief as DebriefData } from "@/lib/types";
import { makePitch, makeSharks, makeTurn } from "./helpers";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
  HTMLElement.prototype.animate = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const all = (delta: number) => (["vikram", "meera", "arjun", "zara"] as const).map((sharkId) => ({ sharkId, delta, line: "" }));

const turns = [
  makeTurn("vikram", "Rs 70 a bag.", { quality: 3, vague: false, reactions: all(5) }),
  // Arjun reacts no more after this answer: he walked out.
  makeTurn("meera", "Word of mouth.", { quality: 1, vague: true, reactions: all(-10) }),
  makeTurn("zara", "Hostel committees.", { quality: 4, vague: false, reactions: all(8).filter((r) => r.sharkId !== "arjun") }),
];

describe("interestSeries", () => {
  it("rebuilds each shark's interest from the applied deltas and ends a line at the walk-out", () => {
    const s = interestSeries(turns, 50);
    expect(s.vikram).toEqual([50, 55, 45, 53]);
    expect(s.arjun).toEqual([50, 55, 45]);
  });

  it("keeps values inside 0 to 100", () => {
    const s = interestSeries([makeTurn("vikram", "x", { reactions: all(80) })], 50);
    expect(s.zara).toEqual([50, 100]);
  });
});

describe("InterestChart", () => {
  it("describes every shark's start and end, and who walked out, in its label", () => {
    render(<InterestChart turns={turns} difficulty="realistic" />);
    const label = screen.getByRole("img").getAttribute("aria-label") ?? "";
    expect(label).toContain("Interest over 3 answers");
    expect(label).toContain("Vikram 50 to 53");
    expect(label).toContain("Arjun 50 to 45 (walked out)");
  });
});

describe("Debrief results grid", () => {
  const debrief: DebriefData = {
    overall: 64,
    verdict: "A grounded pilot.",
    scores: { economics: 6, customer: 7, defensibility: 5, founder: 7, market: 6, answers: 7 },
    strengths: ["Real pilot"],
    weaknesses: ["Thin margins"],
    toughestMoment: { question: "How do you grow?", yourAnswer: "Word of mouth.", betterAnswer: "Hostel committees." },
    sharkWishes: [],
    improvedPitch: "WashMate picks up laundry.",
    fixes: ["Cut the laundromat cost"],
  };

  it("adds the interest trace with answer, still-in, offer and deal readouts when the game is passed in", () => {
    const sharks = makeSharks("realistic");
    sharks.arjun = { ...sharks.arjun, status: "out" };
    render(<Debrief debrief={debrief} pitch={makePitch()} deal={{ sharkId: "zara", amountLakh: 25, equityPct: 10 }} offerCount={2} turns={turns} sharks={sharks} onPitchAgain={() => {}} />);
    const trace = screen.getByRole("region", { name: "How the panel moved" });
    const readouts = within(trace).getAllByRole("term").map((t) => t.textContent);
    expect(readouts).toEqual(["Answers", "Still in", "Offers", "Deal"]);
    expect(trace.textContent).toContain("3 of 4");
    expect(within(trace).getByRole("list", { name: "Chart legend" })).toBeTruthy();
  });

  it("leaves the trace out without turns", () => {
    render(<Debrief debrief={debrief} pitch={makePitch()} deal={null} onPitchAgain={() => {}} />);
    expect(screen.queryByRole("region", { name: "How the panel moved" })).toBeNull();
    expect(screen.getByRole("button", { name: "Download feedback (.txt)" })).toBeTruthy();
  });
});

describe("LandingPreview", () => {
  it("is a tab list over one panel, moved with the arrow keys", () => {
    render(<LandingPreview />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Pitch", "Get grilled", "Negotiate", "Improve"]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[1]);
    expect(screen.getByRole("tabpanel").textContent).toContain("Follow-up");
    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(tabs[3].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toContain("64");
  });

  it("shows the offers on the negotiate tab and ignores other keys", () => {
    render(<LandingPreview />);
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[2]);
    expect(screen.getByRole("tabpanel").textContent).toContain("Rs 25 lakh for 12%");
    fireEvent.keyDown(tabs[2], { key: "Enter" });
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
  });
});
