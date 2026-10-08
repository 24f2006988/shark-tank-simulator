// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Activity } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PitchForm } from "@/components/PitchForm";
import { loadSession } from "@/lib/session";
import { makePitch } from "./helpers";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
  HTMLElement.prototype.animate = vi.fn();
  sessionStorage.clear();
  push.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PitchForm validation and submit", () => {
  const fill = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it("lists every problem in a focused alert, linked to each field, and marks the fields invalid", async () => {
    render(<PitchForm />);
    fill("Equity offered (%)", "95");
    fireEvent.click(screen.getByRole("button", { name: "Pitch to the sharks" }));

    const summary = screen.getByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(summary));
    const links = within(summary).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["#ideaName", "#askLakh", "#equityPct", "#description"]);
    expect(within(summary).getByText("Idea name is required")).toBeTruthy();
    expect(within(summary).getByText(/Equity offered \(%\) must be at most 90/)).toBeTruthy();
    expect(screen.getByLabelText("Idea name").getAttribute("aria-invalid")).toBe("true");
    expect(push).not.toHaveBeenCalled();

    // Fixing a field clears its error straight away.
    fill("Idea name", "ChaiCart");
    expect(screen.getByLabelText("Idea name").getAttribute("aria-invalid")).toBeNull();
  });

  it("shows the implied valuation, then saves the session and opens the tank", () => {
    render(<PitchForm />);
    fill("Idea name", "ChaiCart");
    fill("Ask amount (Rs lakh)", "50");
    fill("Equity offered (%)", "10");
    expect(screen.getByText("That values your company at Rs 5 crore.")).toBeTruthy();
    fill("Your pitch", "We run e-bike chai carts around tech parks in Bengaluru with 1,200 paying office customers.");
    fireEvent.click(screen.getByRole("radio", { name: /Ruthless/ }));
    fireEvent.click(screen.getByRole("button", { name: "Pitch to the sharks" }));

    expect(push).toHaveBeenCalledWith("/tank");
    expect(loadSession()?.pitch).toMatchObject({ ideaName: "ChaiCart", askLakh: 50, equityPct: 10, difficulty: "ruthless" });
    expect(screen.getByRole("button", { name: "Opening the tank…" }).hasAttribute("disabled")).toBe(true);
  });

  it("is ready for a new pitch when the router shows the kept-alive page again", async () => {
    const page = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <PitchForm />
      </Activity>
    );
    const { rerender } = render(page("visible"));
    fireEvent.click(within(screen.getByRole("group", { name: "Try a sample pitch" })).getByRole("button", { name: "Strong pitch" }));
    fireEvent.click(screen.getByRole("button", { name: "Pitch to the sharks" }));
    expect(screen.getByRole("button", { name: "Opening the tank…" })).toBeTruthy();

    rerender(page("hidden"));
    rerender(page("visible"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Pitch to the sharks" }).hasAttribute("disabled")).toBe(false));
  });

  it("loads a sample pitch and announces it", () => {
    render(<PitchForm />);
    fireEvent.click(within(screen.getByRole("group", { name: "Try a sample pitch" })).getByRole("button", { name: "Strong pitch" }));
    expect((screen.getByLabelText("Idea name") as HTMLInputElement).value).not.toBe("");
    expect(screen.getByRole("status").textContent).toMatch(/Strong pitch loaded/);
  });

  it("pre-fills the improved pitch after 'Pitch again', and can reset a customised panel", () => {
    sessionStorage.setItem("shark-tank:prefill", JSON.stringify(makePitch({ description: "An improved pitch with real numbers and named customers in it." })));
    render(<PitchForm />);
    expect(screen.getByRole("status").textContent).toMatch(/improved pitch is loaded/);
    expect((screen.getByLabelText("Your pitch") as HTMLTextAreaElement).value).toContain("improved pitch");

    fireEvent.click(within(screen.getByRole("group", { name: "Zara Khan personality" })).getAllByRole("button")[2]);
    expect(screen.getByText("1 customized")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset panel to defaults" }));
    expect(screen.getByText("Standard 4-shark panel")).toBeTruthy();
  });
});
