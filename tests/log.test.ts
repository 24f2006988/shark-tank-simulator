import { afterEach, describe, expect, it, vi } from "vitest";
import { log } from "@/lib/log";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("log", () => {
  it("writes one structured JSON line that Cloud Logging reads severity and message from", () => {
    vi.stubEnv("NODE_ENV", "production");
    const out = vi.spyOn(console, "log").mockImplementation(() => {});
    log("WARNING", "rate_limited", { route: "turn", ms: 12 });
    expect(out).toHaveBeenCalledOnce();
    expect(JSON.parse(out.mock.calls[0][0] as string)).toEqual({ severity: "WARNING", message: "rate_limited", route: "turn", ms: 12 });
  });

  it("stays quiet under test so test output is not flooded", () => {
    const out = vi.spyOn(console, "log").mockImplementation(() => {});
    log("INFO", "request_done");
    expect(out).not.toHaveBeenCalled();
  });
});
