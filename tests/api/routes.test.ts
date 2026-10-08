import { beforeEach, describe, expect, it, vi } from "vitest";
import { makePitch, makeSharks, makeTurn } from "../helpers";

const generateJson = vi.fn();
vi.mock("@/lib/gemini", () => ({
  generateJson: (...args: unknown[]) => generateJson(...args),
  GeminiError: class extends Error {},
}));

const turnRoute = await import("@/app/api/turn/route");
const offersRoute = await import("@/app/api/offers/route");
const negotiateRoute = await import("@/app/api/negotiate/route");
const debriefRoute = await import("@/app/api/debrief/route");

let ip = 0;
function post(handler: (r: Request) => Promise<Response>, body: unknown, headers: Record<string, string> = {}) {
  // A fresh client IP per request keeps the shared rate limiter out of the way unless a test wants it.
  const request = new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++ip}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return handler(request);
}

const pitch = makePitch();
const session = { pitch, sharks: makeSharks(), turns: [] };

beforeEach(() => {
  generateJson.mockReset();
});

describe("request validation (shared pipeline)", () => {
  it("rejects malformed JSON, invalid input and oversized bodies", async () => {
    expect((await post(turnRoute.POST, "{oops")).status).toBe(400);
    const invalid = await post(turnRoute.POST, { pitch: { ideaName: "x" } });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).issues[0]).toMatchObject({ path: "pitch.ideaName" });
    expect((await post(turnRoute.POST, { junk: "x".repeat(40_000) })).status).toBe(413);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("rate limits a single client", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 32; i++) {
      statuses.push((await post(turnRoute.POST, "{oops", { "x-forwarded-for": "9.9.9.9" })).status);
    }
    expect(statuses.at(-1)).toBe(429);
  });
});

describe("POST /api/turn", () => {
  it("asks an AI opening question", async () => {
    generateJson.mockResolvedValue({ data: { next: { sharkId: "vikram", question: "What is your CAC?", probing: "economics" } }, model: "m" });
    const body = await (await post(turnRoute.POST, session)).json();
    expect(body.source).toBe("ai");
    expect(body.data.next).toEqual({ sharkId: "vikram", question: "What is your CAC?", probing: "economics", isFollowUp: false });
  });

  it("applies reactions and accepts a follow-up after a vague answer", async () => {
    generateJson.mockResolvedValue({
      data: {
        evaluation: { quality: 1, vague: true, reactions: [{ sharkId: "vikram", delta: -15, line: "Numbers, please." }] },
        next: { sharkId: "vikram", question: "One number: your CAC?", probing: "economics" },
      },
      model: "m",
    });
    const body = await (await post(turnRoute.POST, { ...session, turns: [makeTurn("vikram", "lots of people love it")] })).json();
    expect(body.data.sharks.vikram.interest).toBe(35);
    expect(body.data.evaluation.reactions).toHaveLength(4);
    expect(body.data.next).toMatchObject({ sharkId: "vikram", isFollowUp: true });
  });

  it("caps reactions from sharks who did not ask", async () => {
    generateJson.mockResolvedValue({
      data: {
        evaluation: { quality: 1, vague: true, reactions: [{ sharkId: "vikram", delta: -20, line: "" }, { sharkId: "zara", delta: -20, line: "" }] },
        next: { sharkId: "meera", question: "Who pays?", probing: "customer" },
      },
      model: "m",
    });
    const body = await (await post(turnRoute.POST, { ...session, turns: [makeTurn("vikram", "dunno")] })).json();
    expect(body.data.sharks.vikram.interest).toBe(30);
    expect(body.data.sharks.zara.interest).toBe(44);
  });

  it("replaces a question from a shark past the follow-up streak cap", async () => {
    generateJson.mockResolvedValue({
      data: {
        evaluation: { quality: 4, vague: false, reactions: [] },
        next: { sharkId: "vikram", question: "Again me?", probing: "economics" },
      },
      model: "m",
    });
    const turns = [makeTurn("vikram", "a"), makeTurn("vikram", "b"), makeTurn("vikram", "Rs 400 CAC")];
    const body = await (await post(turnRoute.POST, { ...session, turns })).json();
    expect(body.data.next.sharkId).not.toBe("vikram");
    expect(body.data.next.isFollowUp).toBe(false);
  });

  it("falls back to scripted content when Gemini fails, never a 5xx", async () => {
    generateJson.mockImplementation(async () => {
      throw new Error("503");
    });
    const res = await post(turnRoute.POST, { ...session, turns: [makeTurn("vikram", "not sure")] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("fallback");
    expect(body.data.next.question.length).toBeGreaterThan(5);
  });

  it("ends questioning after the last answer without asking again", async () => {
    generateJson.mockResolvedValue({ data: { evaluation: { quality: 3, vague: false, reactions: [] } }, model: "m" });
    const turns = Array.from({ length: 7 }, (_, i) => makeTurn(i % 2 ? "meera" : "zara", "answer"));
    const body = await (await post(turnRoute.POST, { ...session, turns })).json();
    expect(body.data).toMatchObject({ over: true, next: null });
  });
});

describe("POST /api/offers", () => {
  it("returns sanitized offers only from eligible sharks", async () => {
    generateJson.mockResolvedValue({
      data: {
        offers: [
          { sharkId: "meera", amountLakh: 50, equityPct: 15, condition: "", line: "I'm in." },
          { sharkId: "vikram", amountLakh: 50, equityPct: 30, condition: "", line: "Sneaky offer" },
        ],
        outs: [{ sharkId: "vikram", reason: "Your numbers scare me." }],
      },
      model: "m",
    });
    const sharks = makeSharks("realistic", { meera: 80, zara: 70 });
    const body = await (await post(offersRoute.POST, { ...session, sharks })).json();
    expect(body.data.offers.map((o: { sharkId: string }) => o.sharkId)).toEqual(["meera", "zara"]);
    expect(body.data.offers[0].condition).toBeUndefined();
    expect(body.data.outs.find((o: { sharkId: string }) => o.sharkId === "vikram").reason).toBe("Your numbers scare me.");
  });

  it("asks Gemini for in-character reasons when sharks are in but none will offer", async () => {
    generateJson.mockResolvedValue({
      data: { offers: [{ sharkId: "vikram", amountLakh: 50, equityPct: 30, condition: "", line: "x" }], outs: [{ sharkId: "vikram", reason: "No numbers, no money." }] },
      model: "m",
    });
    const sharks = makeSharks("realistic", { vikram: 30, meera: 30, arjun: 30, zara: 30 });
    const body = await (await post(offersRoute.POST, { ...session, sharks })).json();
    expect(body.data.offers).toEqual([]);
    expect(body.data.outs.find((o: { sharkId: string }) => o.sharkId === "vikram").reason).toBe("No numbers, no money.");
  });

  it("reuses walkout reasons without calling Gemini when everyone has left", async () => {
    const sharks = makeSharks();
    for (const s of Object.values(sharks)) Object.assign(s, { status: "out", outReason: `${s.id} left` });
    const body = await (await post(offersRoute.POST, { ...session, sharks })).json();
    expect(body.data.offers).toEqual([]);
    expect(body.data.outs.map((o: { reason: string }) => o.reason)).toContain("zara left");
    expect(generateJson).not.toHaveBeenCalled();
  });
});

describe("POST /api/negotiate", () => {
  const offer = { sharkId: "zara", amountLakh: 50, equityPct: 20, line: "Deal?" };

  it("treats a shark counter above the founder's valuation as acceptance", async () => {
    generateJson.mockResolvedValue({ data: { response: "counter", amountLakh: 50, equityPct: 10, line: "Fine." }, model: "m" });
    const body = await (await post(negotiateRoute.POST, { pitch, offer, counter: { amountLakh: 50, equityPct: 15 }, counters: 0 })).json();
    expect(body.data).toMatchObject({ response: "accept", equityPct: 15 });
  });

  it("uses the scripted rules after two counters without calling Gemini", async () => {
    const body = await (await post(negotiateRoute.POST, { pitch, offer, counter: { amountLakh: 50, equityPct: 15 }, counters: 2 })).json();
    expect(body.data.response).toBe("walk");
    expect(generateJson).not.toHaveBeenCalled();
  });
});

describe("POST /api/debrief", () => {
  it("clamps AI scores and trims lists", async () => {
    generateJson.mockResolvedValue({
      data: {
        overall: 140,
        verdict: "Promising.",
        scores: { economics: 12, customer: 6, defensibility: 2, founder: 4, market: 5, answers: 3 },
        strengths: ["a", "b", "c", "d"],
        weaknesses: ["a"],
        toughestMoment: { question: "q", yourAnswer: "a", betterAnswer: "b" },
        sharkWishes: [{ sharkId: "vikram", wanted: "CAC" }],
        improvedPitch: "Pitch",
        fixes: ["x", "y", "z"],
      },
      model: "m",
    });
    const body = await (await post(debriefRoute.POST, { ...session, deal: null })).json();
    expect(body.data.overall).toBe(100);
    expect(body.data.scores.economics).toBe(10);
    expect(body.data.strengths).toHaveLength(3);
  });

  it("falls back to a scripted debrief", async () => {
    generateJson.mockImplementation(async () => {
      throw new Error("429");
    });
    const res = await post(debriefRoute.POST, { ...session, turns: [makeTurn("vikram", "x")], deal: null });
    const body = await res.json();
    expect(body.source).toBe("fallback");
    expect(body.data.improvedPitch).toContain("ChaiCart");
  });
});
