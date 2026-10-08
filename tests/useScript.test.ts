// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LETTERS_PER_TICK, LINGER_MS, useScript } from "@/components/useScript";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useScript typewriter", () => {
  it("types a line a few letters per tick, lingers, then moves on to the next", () => {
    const text = "Welcome to the tank.";
    const { result } = renderHook(() => useScript(false));
    act(() => result.current.play([{ sharkId: "vikram", text, kind: "greeting" }, { sharkId: "meera", text: "Yes?", kind: "question" }]));
    expect(result.current.shown).toBe(LETTERS_PER_TICK);
    const ticks = Math.ceil(text.length / LETTERS_PER_TICK) - 1;
    act(() => vi.advanceTimersByTime(24 * ticks));
    expect(result.current.shown).toBe(text.length);
    act(() => vi.advanceTimersByTime(LINGER_MS - 1));
    expect(result.current.current?.text).toBe(text);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.current?.text).toBe("Yes?");
  });

  it("carries on from the same letter when sound is toggled mid-line", () => {
    const { result, rerender } = renderHook(({ sound }) => useScript(sound), { initialProps: { sound: false } });
    act(() => result.current.play([{ sharkId: "vikram", text: "What is your burn rate?", kind: "question" }]));
    act(() => vi.advanceTimersByTime(24 * 3));
    const before = result.current.shown;
    expect(before).toBeGreaterThan(5);

    rerender({ sound: true });
    expect(result.current.shown).toBeGreaterThanOrEqual(before);
  });

  it("skip clears the queue", () => {
    const { result } = renderHook(() => useScript(false));
    act(() => result.current.play([{ sharkId: "zara", text: "Tell me more.", kind: "question" }]));
    act(() => result.current.skip());
    expect(result.current.playing).toBe(false);
  });
});
