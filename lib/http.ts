import "server-only";
import type { z } from "zod";
import { log } from "./log";
import { clientIp, createRateLimiter } from "./rateLimit";
import { LIMITS } from "./schemas";
import type { Source } from "./types";

const limiter = createRateLimiter(30, 30);

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/**
 * Shared pipeline for the AI routes: rate limit, body size cap, schema validation, then the
 * handler. Handlers fall back to scripted content themselves, so AI failures never become 5xx.
 */
export async function handle<T>(
  request: Request,
  route: string,
  schema: z.ZodType<T>,
  run: (body: T) => Promise<{ data: unknown; source: Source }>,
): Promise<Response> {
  const started = Date.now();
  const wait = limiter.take(clientIp(request));
  if (wait > 0) {
    log("WARNING", "rate_limited", { route });
    return json({ error: "Too many requests. Take a breath and try again shortly." }, 429, { "Retry-After": String(wait) });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > LIMITS.bodyBytes) return json({ error: "Request is too large." }, 413);
  const raw = await request.text();
  if (raw.length > LIMITS.bodyBytes) return json({ error: "Request is too large." }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Request body must be JSON." }, 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 10).map((i) => ({ path: i.path.join("."), message: i.message }));
    return json({ error: "Invalid input", issues }, 400);
  }

  try {
    const result = await run(parsed.data);
    log("INFO", "request_done", { route, ms: Date.now() - started, source: result.source });
    return json(result);
  } catch (err) {
    log("ERROR", "request_failed", { route, ms: Date.now() - started, reason: err instanceof Error ? err.name : "unknown" });
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
