// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnswerBox } from "@/components/AnswerBox";
import { InterestMeter } from "@/components/InterestMeter";
import { Scorecard } from "@/components/Scorecard";

afterEach(cleanup);

describe("InterestMeter (accessibility)", () => {
  it("exposes a named meter whose text gives value, mood and change, not colour alone", () => {
    render(<InterestMeter name="Vikram" value={42.4} delta={-8} barClass="bg-amber-400" />);
    const meter = screen.getByRole("meter", { name: "Vikram's interest" });
    expect(meter).toHaveProperty("ariaValueNow", "42");
    expect(meter.getAttribute("aria-valuemin")).toBe("0");
    expect(meter.getAttribute("aria-valuemax")).toBe("100");
    expect(meter.getAttribute("aria-valuetext")).toBe("Vikram: 42 out of 100, listening, down 8");
  });

  it("leaves the change out of the spoken text when nothing moved", () => {
    render(<InterestMeter name="Zara" value={85} barClass="bg-rose-400" compact />);
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("Zara: 85 out of 100, hooked");
  });
});

describe("Scorecard (accessibility)", () => {
  it("lists every dimension as a term with its score as the definition", () => {
    render(<Scorecard scores={{ economics: 7.6, customer: 4, defensibility: 2, founder: 9, market: 5, answers: 3 }} />);
    const terms = screen.getAllByRole("term");
    const values = screen.getAllByRole("definition");
    expect(terms).toHaveLength(6);
    expect(values.map((v) => v.textContent)).toEqual(["8/10", "4/10", "2/10", "9/10", "5/10", "3/10"]);
  });
});

describe("AnswerBox (accessibility and keyboard)", () => {
  const setup = (busy = false) => {
    const onSubmit = vi.fn(async () => true);
    const inputRef = createRef<HTMLTextAreaElement>();
    render(<AnswerBox sharkName="Meera" busy={busy} onSubmit={onSubmit} inputRef={inputRef} />);
    return { onSubmit, input: screen.getByLabelText("Your answer to Meera") };
  };

  it("labels the answer field with the shark who asked", () => {
    const { input } = setup();
    expect(input.tagName).toBe("TEXTAREA");
    expect(input.getAttribute("aria-describedby")).toContain("answer-hint");
  });

  it("announces an empty answer as an alert, marks the field invalid and keeps focus there", () => {
    const { onSubmit, input } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Send answer" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Type an answer first/);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(input);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sends on Enter, adds a line on Shift+Enter, then clears the field", async () => {
    const { onSubmit, input } = setup();
    fireEvent.change(input, { target: { value: "Rs 400 CAC, 3 month payback" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Rs 400 CAC, 3 month payback");
    await waitFor(() => expect((input as HTMLTextAreaElement).value).toBe(""));
  });

  it("disables sending while the panel is thinking", () => {
    const { onSubmit, input } = setup(true);
    const form = input.closest("form")!;
    const button = within(form).getByRole("button", { name: "The panel is listening…" });
    expect(button).toHaveProperty("disabled", true);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
