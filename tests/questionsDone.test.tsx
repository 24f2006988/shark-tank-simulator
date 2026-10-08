// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuestionsDone } from "@/components/QuestionsDone";

afterEach(cleanup);

describe("QuestionsDone", () => {
  it("offers the offers while at least one shark is still in", () => {
    const onOffers = vi.fn();
    const onDebrief = vi.fn();
    render(<QuestionsDone noneLeft={false} busy={false} onOffers={onOffers} onDebrief={onDebrief} />);
    expect(screen.queryByRole("button", { name: "See your debrief" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hear the offers" }));
    expect(onOffers).toHaveBeenCalledOnce();
    expect(onDebrief).not.toHaveBeenCalled();
  });

  it("skips the offers and goes to the debrief when every shark has walked out", () => {
    const onOffers = vi.fn();
    const onDebrief = vi.fn();
    render(<QuestionsDone noneLeft busy={false} onOffers={onOffers} onDebrief={onDebrief} />);
    expect(screen.queryByRole("button", { name: "Hear the offers" })).toBeNull();
    expect(screen.getByText(/Every shark has walked out/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "See your debrief" }));
    expect(onDebrief).toHaveBeenCalledOnce();
    expect(onOffers).not.toHaveBeenCalled();
  });

  it("disables the button while a request is running", () => {
    render(<QuestionsDone noneLeft busy onOffers={vi.fn()} onDebrief={vi.fn()} />);
    expect(screen.getByRole("button", { name: "See your debrief" })).toHaveProperty("disabled", true);
  });
});
