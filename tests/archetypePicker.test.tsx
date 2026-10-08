// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PitchForm } from "@/components/PitchForm";
import { SHARK_ARCHETYPES } from "@/lib/sharks";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

describe("PitchForm archetype picker (accessibility)", () => {
  it("groups each shark's presets under their name and marks the selected one with aria-pressed", () => {
    render(<PitchForm />);
    const group = screen.getByRole("group", { name: "Vikram Rao personality" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons).toHaveLength(SHARK_ARCHETYPES.vikram.length);
    expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);

    fireEvent.click(buttons[1]);
    expect(within(screen.getByRole("group", { name: "Vikram Rao personality" })).getAllByRole("button").map((b) => b.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    // Other sharks keep their own default selection.
    const meera = within(screen.getByRole("group", { name: "Meera Iyer personality" })).getAllByRole("button");
    expect(meera[0].getAttribute("aria-pressed")).toBe("true");
  });
});
