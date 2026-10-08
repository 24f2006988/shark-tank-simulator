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
    expect(screen.getByText(/Watch a 60-second demo/)).toBeTruthy();
    expect(screen.queryByText(/Recorded demo/i)).toBeNull();
  });

  it("shows the labelled recording once opened, without autoplaying", async () => {
    const { container } = render(<DemoEntry />);
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(await screen.findByText(/Recorded demo/i)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /play|start/i }).length).toBeGreaterThan(0);
  });
});
