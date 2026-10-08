// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { blipFor, canMumble, playBlip } from "@/components/mumble";

afterEach(() => vi.unstubAllGlobals());

describe("mumble playback", () => {
  it("does nothing where Web Audio is missing", () => {
    expect(canMumble()).toBe(false);
    expect(() => playBlip({ freq: 200, wave: "square", duration: 0.06 })).not.toThrow();
  });

  it("plays one short filtered blip per letter, resuming a suspended context", () => {
    const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 0 });
    const node = () => ({ connect: vi.fn((next: unknown) => next) });
    const osc = { ...node(), type: "", frequency: param(), start: vi.fn(), stop: vi.fn() };
    const resume = vi.fn(async () => {});
    class FakeAudioContext {
      state = "suspended";
      currentTime = 1;
      destination = {};
      resume = resume;
      createOscillator = () => osc;
      createBiquadFilter = () => ({ ...node(), type: "", frequency: param() });
      createGain = () => ({ ...node(), gain: param() });
    }
    vi.stubGlobal("AudioContext", FakeAudioContext);

    const blip = blipFor("meera", "a", 0, "a")!;
    playBlip(blip);
    expect(canMumble()).toBe(true);
    expect(resume).toHaveBeenCalledOnce();
    expect(osc.type).toBe("triangle");
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(blip.freq, 1 + blip.duration);
    expect(osc.start).toHaveBeenCalledWith(1);
    expect(osc.stop).toHaveBeenCalledWith(1 + blip.duration + 0.02);
  });
});
