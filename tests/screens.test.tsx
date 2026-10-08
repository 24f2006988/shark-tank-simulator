// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatLog } from "@/components/ChatLog";
import { Debrief } from "@/components/Debrief";
import { OfferCard } from "@/components/OfferCard";
import { SeatedPanel, SharkCard } from "@/components/SharkCard";
import { Stage, seatCentre } from "@/components/Stage";
import { LINGER_MS, useScript } from "@/components/useScript";
import type { Talk } from "@/lib/session";
import { SHARK_LIST } from "@/lib/sharks";
import type { Debrief as DebriefData, Offer } from "@/lib/types";
import { makePitch, makeSharks, makeTurn } from "./helpers";

beforeEach(() => {
  // Reduced motion: lines appear at once and faces skip their Web Animations nods.
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
  HTMLElement.prototype.animate = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const offer: Offer = { sharkId: "vikram", amountLakh: 50, equityPct: 12.5, line: "I'll back you.", condition: "Board seat" };
const talk = (over: Partial<Talk> = {}): Talk => ({ counters: 0, status: "open", log: [], ...over });

function renderOffer(t: Talk = talk(), busy = false) {
  const handlers = { onAccept: vi.fn(), onDecline: vi.fn(), onCounter: vi.fn(async () => {}) };
  render(<OfferCard offer={offer} pitch={makePitch()} talk={t} busy={busy} {...handlers} />);
  return handlers;
}

describe("OfferCard", () => {
  it("is a named article with the terms, the valuation gap and the condition", () => {
    renderOffer();
    const card = screen.getByRole("article", { name: "Vikram Rao" });
    expect(within(card).getByText("20% below your valuation")).toBeTruthy();
    expect(within(card).getByText("Rs 4 crore")).toBeTruthy();
    expect(within(card).getByText(/Board seat/)).toBeTruthy();
  });

  it("accepts and declines with buttons", () => {
    const h = renderOffer();
    fireEvent.click(screen.getByRole("button", { name: "Accept deal" }));
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(h.onAccept).toHaveBeenCalledOnce();
    expect(h.onDecline).toHaveBeenCalledOnce();
  });

  it("opens a labelled counter form, validates it and sends parsed terms", async () => {
    const h = renderOffer();
    fireEvent.click(screen.getByRole("button", { name: "Counter" }));
    const form = screen.getByRole("form", { name: "Counter-offer to Vikram Rao" });
    const equity = within(form).getByLabelText("Equity (%)");

    fireEvent.change(equity, { target: { value: "95" } });
    fireEvent.submit(form);
    expect(within(form).getByRole("alert").textContent).toMatch(/at most 90/);
    expect(equity.getAttribute("aria-invalid")).toBe("true");
    expect(h.onCounter).not.toHaveBeenCalled();

    fireEvent.change(equity, { target: { value: "10" } });
    expect(within(form).getByText(/values the company at Rs 5 crore/)).toBeTruthy();
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(h.onCounter).toHaveBeenCalledWith({ amountLakh: 50, equityPct: 10 });
  });

  it("disables every action while a reply is pending", () => {
    renderOffer(talk(), true);
    for (const name of ["Accept deal", "Counter", "Decline"]) expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(true);
  });

  it("stops offering counters after the last one and shows a closed deal's status", () => {
    renderOffer(talk({ counters: 2 }));
    expect(screen.queryByRole("button", { name: "Counter" })).toBeNull();
    expect(screen.getByText("Final offer: no more counters.")).toBeTruthy();
    cleanup();
    renderOffer(talk({ status: "accepted" }));
    expect(screen.getByText("Deal accepted")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept deal" })).toBeNull();
  });
});

const debrief: DebriefData = {
  overall: 34,
  verdict: "Interesting, but the numbers are missing.",
  scores: { economics: 2, customer: 5, defensibility: 3, founder: 7, market: 6, answers: 4 },
  strengths: ["Clear founder story"],
  weaknesses: ["No unit economics"],
  toughestMoment: { question: "What is your CAC?", yourAnswer: "Low.", betterAnswer: "Rs 180, paid back in 3 months." },
  sharkWishes: [{ sharkId: "vikram", wanted: "A margin per cup." }],
  improvedPitch: "ChaiCart serves 1,200 office workers a day.",
  fixes: ["Work out CAC"],
};

describe("Debrief", () => {
  it("reads out the score, its band and every section as headed regions", () => {
    render(<Debrief debrief={debrief} pitch={makePitch()} deal={null} onPitchAgain={() => {}} />);
    expect(screen.getByText("Overall score:")).toBeTruthy();
    expect(screen.getByText("Not ready yet")).toBeTruthy();
    expect(screen.getByText("You left the tank without a deal.")).toBeTruthy();
    for (const name of ["The verdict", "Scorecard", "Your toughest moment, answered better", "What each shark needed to hear", "Your improved 60-second pitch", "Fix these before a real meeting"]) {
      expect(screen.getByRole("region", { name })).toBeTruthy();
    }
  });

  it("names the deal and sends the founder back with the improved pitch", () => {
    const onPitchAgain = vi.fn();
    render(<Debrief debrief={{ ...debrief, overall: 82 }} pitch={makePitch()} deal={{ sharkId: "meera", amountLakh: 50, equityPct: 10 }} onPitchAgain={onPitchAgain} />);
    expect(screen.getByText("Investor-ready")).toBeTruthy();
    expect(screen.getByText(/You closed with Meera Iyer: Rs 50 lakh for 10%/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pitch again with this" }));
    expect(onPitchAgain).toHaveBeenCalledOnce();
  });
});

describe("Stage", () => {
  const props = { line: null, shown: 0, thinking: null, deltas: {}, round: 0 };

  it("announces the open question to screen readers in one piece", () => {
    render(
      <Stage {...props} sharks={makeSharks()} idle={{ sharkId: "meera", text: "Who pays you today?", kind: "question", followUp: true, probing: "customer" }} />,
    );
    expect(screen.getByRole("region", { name: "The panel" })).toBeTruthy();
    expect(screen.getByText("Meera Iyer, follow-up: Who pays you today?")).toBeTruthy();
    expect(screen.getByText("Follow-up")).toBeTruthy();
    expect(screen.getByText("Probing: Customers and demand")).toBeTruthy();
  });

  it("stamps a shark who walked out", () => {
    const sharks = makeSharks();
    sharks.arjun.status = "out";
    render(<Stage {...props} sharks={sharks} idle={null} />);
    expect(screen.getAllByText("OUT")).toHaveLength(1);
  });

  it("offers Skip ahead while a line is being performed", () => {
    const onSkip = vi.fn();
    render(<Stage {...props} sharks={makeSharks()} idle={null} line={{ id: 1, sharkId: "zara", text: "Hello there", kind: "greeting" }} shown={3} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip ahead" }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("centres the bubble's tail over each seat", () => {
    expect(seatCentre("vikram")).toBe(12.5);
    expect(seatCentre("zara")).toBe(87.5);
  });
});

describe("ChatLog", () => {
  it("is a live log of questions, rated answers, reactions and walkouts", () => {
    const turns = [
      makeTurn("vikram", "We make Rs 4 per cup.", {
        quality: 2,
        vague: true,
        reactions: [{ sharkId: "meera", delta: -9, line: "That's thin." }],
      }),
      makeTurn("meera"),
    ];
    render(<ChatLog turns={turns} walkouts={[{ sharkId: "arjun", reason: "No moat.", afterAnswer: 1 }]} pendingAnswer="Typing…" />);
    const log = screen.getByRole("log", { name: "Conversation with the panel" });
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(within(log).getByText("Rated Shaky (2/5) · the panel found it vague")).toBeTruthy();
    expect(within(log).getByText("That's thin.")).toBeTruthy();
    expect(within(log).getByRole("note").textContent).toContain("Arjun Mehta is out.");
    expect(within(log).getByText("Typing…")).toBeTruthy();
  });
});

describe("useScript", () => {
  it("plays queued lines in order, skipping blank ones, and can be skipped", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScript(false));
    act(() =>
      result.current.play([
        { sharkId: "vikram", text: "First.", kind: "question" },
        { sharkId: "meera", text: "  ", kind: "reaction" },
        { sharkId: "zara", text: "Second.", kind: "reaction" },
      ]),
    );
    expect(result.current.current?.text).toBe("First.");
    expect(result.current.shown).toBe(6);
    act(() => void vi.advanceTimersByTime(LINGER_MS + 50));
    expect(result.current.current?.text).toBe("Second.");
    act(() => result.current.skip());
    expect(result.current.playing).toBe(false);
  });
});

describe("Landing panel", () => {
  it("seats every shark behind a nameplate in a labelled list", () => {
    render(<SeatedPanel sharks={SHARK_LIST} />);
    const items = within(screen.getByRole("list", { name: "The panel" })).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0].textContent).toContain("Vikram Rao");
    expect(items[0].textContent).toContain("The Numbers");
  });

  it("gives each bio card a heading, lens and bio", () => {
    render(<SharkCard shark={SHARK_LIST[1]} />);
    const card = screen.getByRole("article");
    expect(within(card).getByRole("heading", { name: "Meera Iyer" })).toBeTruthy();
    expect(card.textContent).toContain(`Lens: ${SHARK_LIST[1].lensLabel}`);
    expect(card.textContent).toContain(SHARK_LIST[1].bio);
  });
});

describe("ChatLog structure", () => {
  it("keeps the transcript a real list inside the live log region (WCAG 1.3.1)", () => {
    render(<ChatLog turns={[makeTurn("vikram", "We make Rs 4 per cup.")]} walkouts={[]} />);
    const log = screen.getByRole("log", { name: "Conversation with the panel" });
    const list = within(log).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});
