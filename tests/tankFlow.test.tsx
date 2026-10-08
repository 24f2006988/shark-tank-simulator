// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Tank from "@/components/Tank";
import { ApiError, api } from "@/lib/api-client";
import { createSession, saveSession } from "@/lib/session";
import type { ApiResponse, Debrief, OffersResult, TurnResult } from "@/lib/types";
import { makePitch, makeSharks } from "./helpers";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api-client", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...real, api: { turn: vi.fn(), offers: vi.fn(), negotiate: vi.fn(), debrief: vi.fn() } };
});

const ok = <T,>(data: T): ApiResponse<T> => ({ data, source: "ai" });

const opening: TurnResult = {
  evaluation: null,
  sharks: makeSharks(),
  next: { sharkId: "vikram", question: "What does one cup cost you to make?", probing: "economics", isFollowUp: false },
  over: false,
};

const afterAnswer: TurnResult = {
  evaluation: {
    quality: 4,
    vague: false,
    reactions: [{ sharkId: "vikram", delta: 9, line: "Those margins hold up." }],
    walkouts: [],
  },
  sharks: makeSharks("realistic", { vikram: 70 }),
  next: null,
  over: true,
};

const offers: OffersResult = {
  offers: [{ sharkId: "vikram", amountLakh: 50, equityPct: 12, line: "I'm in.", condition: "" }],
  outs: [],
};

const debrief: Debrief = {
  overall: 78,
  verdict: "Strong numbers, thin distribution story.",
  scores: { economics: 8, customer: 6, defensibility: 5, founder: 7, market: 6, answers: 8 },
  strengths: ["Clear unit economics"],
  weaknesses: ["No named customers"],
  toughestMoment: { question: "What does one cup cost you to make?", yourAnswer: "Rs 6.", betterAnswer: "Rs 6 all-in, sold at Rs 15." },
  sharkWishes: [{ sharkId: "meera", wanted: "Three named offices." }],
  improvedPitch: "ChaiCart serves 1,200 cups a day at 60% margin.",
  fixes: ["Name three paying offices"],
};

beforeEach(() => {
  // Reduced motion: every line appears at once, so the script finishes quickly in tests.
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
  HTMLElement.prototype.animate = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  sessionStorage.clear();
  vi.mocked(api.turn).mockReset();
  vi.mocked(api.offers).mockReset();
  vi.mocked(api.debrief).mockReset();
  push.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const startSession = () => saveSession(createSession(makePitch()));

describe("Tank (whole game flow, API mocked)", () => {
  it("shows an empty tank with a way back when there is no pitch in progress", () => {
    render(<Tank />);
    expect(screen.getByRole("heading", { name: "The tank is empty" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Write a pitch" }).getAttribute("href")).toBe("/");
  });

  it("runs pitch, question, answer, offers, deal and debrief, one API call per step", async () => {
    startSession();
    vi.mocked(api.turn).mockResolvedValueOnce(ok(opening)).mockResolvedValueOnce(ok(afterAnswer));
    vi.mocked(api.offers).mockResolvedValueOnce(ok(offers));
    vi.mocked(api.debrief).mockResolvedValueOnce(ok(debrief));
    render(<Tank />);

    // Opening question: the founder is asked to answer Vikram.
    const answer = await screen.findByLabelText(/Your answer to Vikram Rao/, {}, { timeout: 4000 });
    expect(vi.mocked(api.turn).mock.calls[0][0].turns).toEqual([]);

    fireEvent.change(answer, { target: { value: "Rs 6 a cup all-in, we sell at Rs 15, so 60% gross margin." } });
    fireEvent.click(screen.getByRole("button", { name: "Send answer" }));

    // The answered turn is sent, then questioning ends and the offers open.
    const hear = await screen.findByRole("button", { name: "Hear the offers" }, { timeout: 4000 });
    const sent = vi.mocked(api.turn).mock.calls[1][0].turns;
    expect(sent.at(-1)?.answer).toContain("60% gross margin");
    expect(screen.getByRole("region", { name: "Transcript (1 answered)" })).toBeTruthy();

    fireEvent.click(hear);
    const card = await screen.findByRole("article", { name: "Vikram Rao" }, { timeout: 4000 });
    expect(card.textContent).toContain("Rs 50 lakh for 12%");
    // Accepting closes the deal and moves straight on to the debrief.
    fireEvent.click(within(card).getByRole("button", { name: "Accept deal" }));
    expect(await screen.findByRole("heading", { name: "Your debrief" }, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText("Strong numbers, thin distribution story.")).toBeTruthy();
    expect(vi.mocked(api.debrief).mock.calls[0][0].deal).toMatchObject({ sharkId: "vikram", amountLakh: 50, equityPct: 12 });

    // "Pitch again" carries the improved pitch back to the form.
    fireEvent.click(screen.getByRole("button", { name: "Pitch again with this" }));
    expect(push).toHaveBeenCalledWith("/");
    expect(JSON.parse(sessionStorage.getItem("shark-tank:prefill") ?? "{}").description).toBe(debrief.improvedPitch);
  });

  it("lets the founder decline every offer and still get feedback", async () => {
    const session = createSession(makePitch());
    saveSession({ ...session, stage: "deal", over: true, offers: offers.offers, talks: { vikram: { counters: 0, status: "open", log: [] } } });
    vi.mocked(api.debrief).mockResolvedValueOnce(ok(debrief));
    render(<Tank />);

    expect(screen.getByRole("button", { name: "Walk away with no deal" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(screen.getByText("You declined this offer")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Get my feedback" }));
    expect(await screen.findByText("You left the tank without a deal.", {}, { timeout: 4000 })).toBeTruthy();
    expect(vi.mocked(api.debrief).mock.calls[0][0].deal).toBeNull();
  });

  it("shows an error with a retry that repeats the same request", async () => {
    startSession();
    vi.mocked(api.turn).mockRejectedValueOnce(new ApiError("Too many requests.", 429)).mockResolvedValueOnce(ok(opening));
    render(<Tank />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Too many requests.");
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));

    expect(await screen.findByLabelText(/Your answer to Vikram Rao/, {}, { timeout: 4000 })).toBeTruthy();
    expect(api.turn).toHaveBeenCalledTimes(2);
  });

  it("goes straight to the debrief when every shark has walked out", async () => {
    startSession();
    const allOut = makeSharks();
    for (const s of Object.values(allOut)) s.status = "out";
    vi.mocked(api.turn)
      .mockResolvedValueOnce(ok(opening))
      .mockResolvedValueOnce(ok({ ...afterAnswer, sharks: allOut, evaluation: { ...afterAnswer.evaluation!, quality: 1, vague: true } }));
    vi.mocked(api.debrief).mockResolvedValueOnce(ok({ ...debrief, overall: 12 }));
    render(<Tank />);

    fireEvent.change(await screen.findByLabelText(/Your answer to Vikram Rao/, {}, { timeout: 4000 }), { target: { value: "It's cheap." } });
    fireEvent.click(screen.getByRole("button", { name: "Send answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "See your debrief" }, { timeout: 4000 }));

    await waitFor(() => expect(screen.getByText("Not ready yet")).toBeTruthy(), { timeout: 4000 });
    expect(api.offers).not.toHaveBeenCalled();
  });
});
