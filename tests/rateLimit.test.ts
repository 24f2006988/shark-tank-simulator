import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

describe("createRateLimiter", () => {
  it("allows the burst capacity, then asks the caller to wait, then refills", () => {
    let now = 0;
    const limiter = createRateLimiter(3, 60, () => now);
    expect([limiter.take("a"), limiter.take("a"), limiter.take("a")]).toEqual([0, 0, 0]);
    expect(limiter.take("a")).toBeGreaterThan(0);
    expect(limiter.take("b")).toBe(0);
    now += 1000;
    expect(limiter.take("a")).toBe(0);
  });
});

describe("clientIp", () => {
  it("uses the address Cloud Run appended, not one the client supplied", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "6.6.6.6, 1.2.3.4" } });
    expect(clientIp(req)).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4" } }))).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });

  it("cannot be dodged by sending a fresh spoofed address each time", () => {
    const keys = ["a", "b", "c"].map((spoof) => clientIp(new Request("http://x", { headers: { "x-forwarded-for": `${spoof}, 1.2.3.4` } })));
    expect(new Set(keys).size).toBe(1);
  });
});
