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
  it("uses the first forwarded address", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientIp(req)).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
