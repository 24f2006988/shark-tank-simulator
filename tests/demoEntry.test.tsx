// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoEntry } from "@/components/DemoEntry";

vi.mock("next/dynamic", async () => {
  const { DemoReplay } = await import("@/components/DemoReplay");
  return {
    default: () => DemoReplay,
  };
});

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DemoEntry", () => {
  it("is collapsed and mounts no replay until it is opened", () => {
    const { container } = render(<DemoEntry />);
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(screen.getByText(/Watch a recorded demo/)).toBeTruthy();
    expect(screen.queryByText(/Recorded demo: not live AI output/)).toBeNull();
  });

  it("shows the labelled recording once opened, without autoplaying", async () => {
    const { container } = render(<DemoEntry />);
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(await screen.findByText(/Recorded demo: not live AI output/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /play|start/i }).length).toBeGreaterThan(0);
  });
});

describe("DemoEntry 'Watch a win on Ruthless'", () => {
  it("opens the replay on the Ruthless recording, already playing, and brings it into view", async () => {
    const { container } = render(<DemoEntry />);
    const details = container.querySelector("details")!;
    details.scrollIntoView = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    fireEvent.click(screen.getByRole("button", { name: "Watch a win on Ruthless" }));

    expect(details.open).toBe(true);
    expect((await screen.findByRole("button", { name: "Ruthless win" })).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/ChaiCart: Rs 50 lakh for 10% \(ruthless\)/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    expect(details.scrollIntoView).toHaveBeenCalled();
  });
});

describe("DemoEntry 'try it live'", () => {
  it("closes the replay and moves focus to the pitch form's first field", async () => {
    const field = document.createElement("input");
    field.id = "ideaName";
    field.scrollIntoView = vi.fn();
    document.body.append(field);

    const { container } = render(<DemoEntry />);
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    fireEvent.click(await screen.findByRole("button", { name: "Try it live" }));

    expect(document.activeElement).toBe(field);
    expect(field.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
    expect(screen.queryByText(/Recorded demo: not live AI output/)).toBeNull();
    field.remove();
  });
});
