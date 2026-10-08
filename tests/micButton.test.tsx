// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { MicButton, getSpeechErrorMessage } from "@/components/MicButton";
import type { SpeechEvent, SpeechErrorEvent, Recognition } from "@/components/MicButton";

class MockSpeechRecognition implements Recognition {
  lang = "en-US";
  interimResults = false;
  continuous = false;
  onresult: ((e: SpeechEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: SpeechErrorEvent) => void) | null = null;

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  static lastInstance: MockSpeechRecognition | null = null;

  constructor() {
    MockSpeechRecognition.lastInstance = this;
  }
}

describe("MicButton", () => {
  const originalSpeechRecognition = (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  const originalWebkitSpeech = (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

  beforeEach(() => {
    MockSpeechRecognition.lastInstance = null;
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  afterEach(() => {
    cleanup();
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = originalSpeechRecognition;
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = originalWebkitSpeech;
  });

  it("renders nothing when SpeechRecognition is not supported (progressive enhancement)", () => {
    const onTranscript = vi.fn();
    const { container } = render(<MicButton onTranscript={onTranscript} />);
    expect(container.firstChild).toBeNull();
  });

  describe("when SpeechRecognition is supported", () => {
    beforeEach(() => {
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition;
    });

    it("renders the button with initial idle state and accessible label", () => {
      const onTranscript = vi.fn();
      render(<MicButton onTranscript={onTranscript} label="Dictate pitch" />);

      const button = screen.getByRole("button", { name: "Dictate pitch" });
      expect(button).toBeDefined();
      expect(button.getAttribute("aria-pressed")).toBe("false");
    });

    it("activates speech recognition on click with continuous and interim options", () => {
      const onTranscript = vi.fn();
      render(<MicButton onTranscript={onTranscript} label="Dictate pitch" />);

      const button = screen.getByRole("button", { name: "Dictate pitch" });
      fireEvent.click(button);

      expect(MockSpeechRecognition.lastInstance).not.toBeNull();
      const instance = MockSpeechRecognition.lastInstance!;
      expect(instance.start).toHaveBeenCalledTimes(1);
      expect(instance.continuous).toBe(true);
      expect(instance.interimResults).toBe(true);

      expect(screen.getByRole("button", { name: "Stop listening" })).toBeDefined();
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });

    it("displays live interim transcript while user is speaking", () => {
      const onTranscript = vi.fn();
      render(<MicButton onTranscript={onTranscript} />);

      fireEvent.click(screen.getByRole("button", { name: "Speak your answer" }));
      const instance = MockSpeechRecognition.lastInstance!;

      // Interim speech event
      act(() => {
        instance.onresult?.({
          resultIndex: 0,
          results: {
            length: 1,
            0: {
              isFinal: false,
              length: 1,
              0: { transcript: "Our traction is" },
            },
          },
        });
      });

      expect(screen.getByText(/Our traction is/)).toBeDefined();
      expect(onTranscript).not.toHaveBeenCalled();
    });

    it("calls onTranscript when speech results are finalized", () => {
      const onTranscript = vi.fn();
      render(<MicButton onTranscript={onTranscript} />);

      fireEvent.click(screen.getByRole("button", { name: "Speak your answer" }));
      const instance = MockSpeechRecognition.lastInstance!;

      act(() => {
        instance.onresult?.({
          resultIndex: 0,
          results: {
            length: 1,
            0: {
              isFinal: true,
              length: 1,
              0: { transcript: "50 lakhs monthly recurring revenue." },
            },
          },
        });
      });

      expect(onTranscript).toHaveBeenCalledWith("50 lakhs monthly recurring revenue.");
    });

    it("commits remaining interim speech when user stops listening", () => {
      const onTranscript = vi.fn();
      render(<MicButton onTranscript={onTranscript} />);

      fireEvent.click(screen.getByRole("button", { name: "Speak your answer" }));
      const instance = MockSpeechRecognition.lastInstance!;

      act(() => {
        instance.onresult?.({
          resultIndex: 0,
          results: {
            length: 1,
            0: {
              isFinal: false,
              length: 1,
              0: { transcript: "last minute thoughts" },
            },
          },
        });
      });

      // User clicks Stop
      fireEvent.click(screen.getByRole("button", { name: "Stop listening" }));
      expect(instance.stop).toHaveBeenCalledTimes(1);
      expect(onTranscript).toHaveBeenCalledWith("last minute thoughts");
    });

    it("displays accessible alert when microphone access is denied", () => {
      const onTranscript = vi.fn();
      render(<MicButton onTranscript={onTranscript} />);

      fireEvent.click(screen.getByRole("button", { name: "Speak your answer" }));
      const instance = MockSpeechRecognition.lastInstance!;

      act(() => {
        instance.onerror?.({ error: "not-allowed" });
      });

      const alert = screen.getByRole("alert");
      expect(alert.textContent).toMatch(/Microphone access blocked/i);
      expect(screen.getByRole("button", { name: "Speak your answer" })).toBeDefined();
    });

    it("displays accessible alert for network errors and allows dismissing", () => {
      const onTranscript = vi.fn();
      render(<MicButton onTranscript={onTranscript} />);

      fireEvent.click(screen.getByRole("button", { name: "Speak your answer" }));
      const instance = MockSpeechRecognition.lastInstance!;

      act(() => {
        instance.onerror?.({ error: "network" });
      });

      const alert = screen.getByRole("alert");
      expect(alert.textContent).toMatch(/Speech service network error/i);

      // Dismiss button
      const dismiss = screen.getByRole("button", { name: "Dismiss error" });
      fireEvent.click(dismiss);

      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("aborts recognition on unmount if currently listening", () => {
      const onTranscript = vi.fn();
      const { unmount } = render(<MicButton onTranscript={onTranscript} />);

      fireEvent.click(screen.getByRole("button", { name: "Speak your answer" }));
      const instance = MockSpeechRecognition.lastInstance!;

      unmount();
      expect(instance.abort).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSpeechErrorMessage helper", () => {
    it("returns descriptive strings for known Web Speech API error codes", () => {
      expect(getSpeechErrorMessage("not-allowed")).toMatch(/Microphone access blocked/);
      expect(getSpeechErrorMessage("no-speech")).toMatch(/No speech detected/);
      expect(getSpeechErrorMessage("audio-capture")).toMatch(/No microphone found/);
      expect(getSpeechErrorMessage("network")).toMatch(/network error/);
      expect(getSpeechErrorMessage("language-not-supported")).toMatch(/not supported/);
      expect(getSpeechErrorMessage("unknown-code")).toContain("unknown-code");
    });
  });
});
