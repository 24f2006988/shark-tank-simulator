import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "@/lib/api-client";
import { makePitch, makeSharks } from "./helpers";

const slice = () => ({ pitch: makePitch(), sharks: makeSharks(), turns: [] });
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("POSTs JSON to the route and returns { data, source }", async () => {
    const fetchMock = reply(200, { data: { over: false }, source: "ai" });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.turn(slice())).resolves.toEqual({ data: { over: false }, source: "ai" });
    const [path, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe("/api/turn");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body)).pitch.ideaName).toBe("ChaiCart");
  });

  it("calls each route", async () => {
    const fetchMock = reply(200, { data: {}, source: "ai" });
    vi.stubGlobal("fetch", fetchMock);
    await api.offers(slice());
    await api.debrief({ ...slice(), deal: null });
    await api.negotiate({
      pitch: makePitch(),
      offer: { sharkId: "vikram", amountLakh: 50, equityPct: 12, line: "Deal?" },
      counter: { amountLakh: 50, equityPct: 10 },
      counters: 0,
    });
    expect(fetchMock.mock.calls.map((c) => (c as unknown[])[0])).toEqual(["/api/offers", "/api/debrief", "/api/negotiate"]);
  });

  it("turns a validation error into a readable ApiError with the first issue", async () => {
    vi.stubGlobal("fetch", reply(400, { error: "Invalid input", issues: [{ path: "pitch.ideaName", message: "Idea name is required" }] }));
    const err = await api.turn(slice()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: "Invalid input: Idea name is required", status: 400 });
  });

  it("passes the server's message through on a rate limit", async () => {
    vi.stubGlobal("fetch", reply(429, { error: "Too many requests." }));
    await expect(api.turn(slice())).rejects.toMatchObject({ message: "Too many requests.", status: 429 });
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 502 })));
    await expect(api.turn(slice())).rejects.toMatchObject({ message: "Request failed (502).", status: 502 });
  });

  it("reports a network failure as status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(api.turn(slice())).rejects.toMatchObject({ status: 0, message: expect.stringContaining("Couldn't reach the tank") });
  });
});
