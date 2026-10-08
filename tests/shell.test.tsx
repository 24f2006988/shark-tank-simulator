// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PanelList } from "@/components/PanelList";
import { Shell } from "@/components/Shell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createSharks } from "@/lib/game";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Shell", () => {
  it("marks the last breadcrumb as the current page and links the earlier ones", () => {
    render(
      <Shell crumbs={[{ label: "Home", href: "/" }, { label: "Pitch" }]}>
        <p>content</p>
      </Shell>,
    );
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav.querySelector("a")?.getAttribute("href")).toBe("/");
    expect(nav.querySelector("[aria-current=page]")?.textContent).toBe("Pitch");
    expect(screen.getByRole("main").id).toBe("main");
  });

  it("puts the brand and the disclaimer in the page itself when there is no sidebar", () => {
    const { container, rerender } = render(<Shell crumbs={[{ label: "Home" }]}>content</Shell>);
    expect(container.querySelector("aside")).toBeNull();
    expect(screen.getByRole("link", { name: "Shark Tank Simulator home" }).className).not.toContain("md:hidden");
    expect(screen.getByRole("contentinfo").className).not.toContain("md:hidden");
    rerender(<Shell crumbs={[{ label: "Home" }]} sidebar={<p>panel</p>}>content</Shell>);
    expect(container.querySelector("aside")).not.toBeNull();
    expect(screen.getByRole("contentinfo").className).toContain("md:hidden");
  });
});

describe("PanelList", () => {
  it("lists the four sharks without meters before a pitch", () => {
    render(<PanelList />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByRole("meter")).toBeNull();
  });

  it("shows one named interest meter per shark during a pitch and flags those who are out", () => {
    const sharks = createSharks("realistic");
    sharks.arjun = { ...sharks.arjun, status: "out" };
    render(<PanelList sharks={sharks} />);
    expect(screen.getAllByRole("meter")).toHaveLength(4);
    expect(screen.getByRole("meter", { name: "Vikram's interest" })).toBeTruthy();
    expect(screen.getByText("out")).toBeTruthy();
  });
});

describe("ThemeToggle", () => {
  it("switches the theme, reflects it in aria-pressed and remembers the choice", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Dark theme" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("shark-tank:theme")).toBe("dark");
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
