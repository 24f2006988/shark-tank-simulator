import type { ApiResponse, Deal, Debrief, NegotiateResult, Offer, OffersResult, Pitch, Sharks, Terms, Turn, TurnResult } from "./types";

const TIMEOUT_MS = 45_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError("Couldn't reach the tank. Check your connection and try again.", 0);
  }
  const json = (await res.json().catch(() => null)) as (ApiResponse<T> & { error?: string; issues?: { message: string }[] }) | null;
  if (!res.ok || !json) {
    const detail = json?.issues?.[0]?.message;
    const message = json?.error ?? `Request failed (${res.status}).`;
    throw new ApiError(detail ? `${message}: ${detail}` : message, res.status);
  }
  return json;
}

interface SessionSlice {
  pitch: Pitch;
  sharks: Sharks;
  turns: Turn[];
}

export const api = {
  turn: (body: SessionSlice) => post<TurnResult>("/api/turn", body),
  offers: (body: SessionSlice) => post<OffersResult>("/api/offers", body),
  negotiate: (body: { pitch: Pitch; offer: Offer; counter: Terms; counters: number }) => post<NegotiateResult>("/api/negotiate", body),
  debrief: (body: SessionSlice & { deal: Deal | null }) => post<Debrief>("/api/debrief", body),
};
