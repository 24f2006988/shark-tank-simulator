// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createSession, loadSession, readSessionId, saveSession } from "@/lib/session";
import type { Pitch } from "@/lib/types";

const pitch: Pitch = {
  ideaName: "ChaiCart",
  oneLiner: "Hot chai delivered to offices",
  askLakh: 50,
  equityPct: 10,
  description: "We run e-bike chai carts around tech parks in Bengaluru for offices.",
  difficulty: "realistic",
};

beforeEach(() => sessionStorage.clear());

// The router keeps the tank page alive between visits; the session id is how it tells a new pitch from the old one.
describe("session identity", () => {
  it("gives every new pitch its own id", () => {
    expect(createSession(pitch).id).not.toBe(createSession(pitch).id);
  });

  it("reads the id of the stored game, or null when there is none", () => {
    expect(readSessionId()).toBeNull();
    const first = createSession(pitch);
    saveSession(first);
    expect(readSessionId()).toBe(first.id);
    const second = createSession({ ...pitch, ideaName: "SolarDost" });
    saveSession(second);
    expect(readSessionId()).toBe(second.id);
  });

  it("ignores a stored game without an id", () => {
    const legacy: Partial<ReturnType<typeof createSession>> = createSession(pitch);
    delete legacy.id;
    sessionStorage.setItem("shark-tank:session", JSON.stringify(legacy));
    expect(loadSession()).toBeNull();
  });
});
