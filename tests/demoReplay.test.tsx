// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoReplay, beatDelayMs } from "@/components/DemoReplay";
import { DEMO_SCRIPTS } from "@/lib/demoScript";
import { SHARK_IDS } from "@/lib/schemas";

beforeEach(() => {
  // jsdom has neither matchMedia nor the Web Animations API; SharkFace uses both for nods and head shakes.
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
  HTMLElement.prototype.animate = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("recorded demo scripts", () => {
  it("cover every shark in every beat and start with a question", () => {
    for (const script of DEMO_SCRIPTS) {
      expect(script.beats[0].kind).toBe("question");
      for (const beat of script.beats) {
        expect(beat.text.length).toBeGreaterThan(0);
        for (const id of SHARK_IDS) expect(beat.interests).toHaveProperty(id);
        if (beat.kind !== "answer") expect(beat.sharkId).toBeDefined();
      }
    }
  });

  it("show the strong pitch ending in a deal and the weak one with every shark out", () => {
    const strong = DEMO_SCRIPTS.find((s) => s.id === "strong")!;
    const weak = DEMO_SCRIPTS.find((s) => s.id === "weak")!;
    expect(strong.beats.some((b) => b.kind === "offer")).toBe(true);
    expect(strong.summary.outcome).toMatch(/^Deal:/);
    expect(Object.values(weak.beats.at(-1)!.interests).every((v) => v === null)).toBe(true);
    expect(weak.summary.overall).toBeLessThan(strong.summary.overall);
  });
});

describe("beatDelayMs", () => {
  it("stays within the pacing bounds", () => {
    expect(beatDelayMs("hi")).toBe(2500);
    expect(beatDelayMs("x".repeat(10_000))).toBe(9000);
    expect(beatDelayMs("x".repeat(100))).toBe(4800);
  });
});

describe("DemoReplay", () => {
  it("is clearly labelled as a recording and makes no network calls", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<DemoReplay />);
    expect(screen.getByText(/Recorded demo: not live AI output/)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("steps through the beats with Next and Back and announces each line in a live region", () => {
    render(<DemoReplay />);
    const live = () => document.querySelector("[aria-live]")?.textContent;
    expect(live()).toBe(DEMO_SCRIPTS[0].beats[0].text);
    expect(screen.getByRole("button", { name: "Back" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(live()).toBe(DEMO_SCRIPTS[0].beats[1].text);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(live()).toBe(DEMO_SCRIPTS[0].beats[0].text);
  });

  it("plays on a timer and pauses on request", () => {
    vi.useFakeTimers();
    render(<DemoReplay />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    act(() => void vi.advanceTimersByTime(MAX_WAIT));
    expect(screen.getByText(/Step 2 of/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => void vi.advanceTimersByTime(MAX_WAIT * 3));
    expect(screen.getByText(/Step 2 of/)).toBeTruthy();
  });

  it("stays silent for screen readers while it plays and announces again when paused", () => {
    render(<DemoReplay />);
    const live = () => document.querySelector("[aria-live]")?.getAttribute("aria-live");
    expect(live()).toBe("polite");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(live()).toBe("off");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(live()).toBe("polite");
  });

  it("switches to the weak pitch, jumps to the result and offers a replay and a live try", () => {
    const onTryLive = vi.fn();
    render(<DemoReplay onTryLive={onTryLive} />);
    fireEvent.click(screen.getByRole("button", { name: "Weak pitch" }));
    expect(screen.getByRole("button", { name: "Weak pitch" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Skip to the result" }));
    expect(screen.getByText(/No deal: every shark is out/)).toBeTruthy();
    expect(screen.getAllByText("OUT")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByText(/Step 1 of/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try it live" }));
    expect(onTryLive).toHaveBeenCalledOnce();
  });
});

const MAX_WAIT = 9000;
