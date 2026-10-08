// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScript } from "@/components/useScript";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useScript typewriter", () => {
  it("types a line letter by letter, then moves on to the next", () => {
    const { result } = renderHook(() => useScript(false));
    act(() => result.current.play([{ sharkId: "vikram", text: "Hi.", kind: "greeting" }, { sharkId: "meera", text: "Yes?", kind: "question" }]));
    expect(result.current.current?.text).toBe("Hi.");
    act(() => vi.advanceTimersByTime(24 * 3));
    expect(result.current.shown).toBe(3);
    act(() => vi.advanceTimersByTime(650));
    expect(result.current.current?.text).toBe("Yes?");
  });

  it("carries on from the same letter when sound is toggled mid-line", () => {
    const { result, rerender } = renderHook(({ sound }) => useScript(sound), { initialProps: { sound: false } });
    act(() => result.current.play([{ sharkId: "vikram", text: "What is your burn rate?", kind: "question" }]));
    act(() => vi.advanceTimersByTime(24 * 9));
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
