import { createSharks } from "./game";
import type { Deal, Debrief, NegotiateResult, Offer, OffersResult, Pitch, Question, SharkId, Sharks, Stage, Terms, Turn, TurnResult } from "./types";

/** A shark leaving the tank, and after which answer it happened (for the chat log). */
export interface Walkout {
  sharkId: SharkId;
  reason: string;
  afterAnswer: number;
}

export interface TalkEntry {
  from: "founder" | SharkId;
  amountLakh: number;
  equityPct: number;
  line?: string;
}

/** Negotiation state for one offer. */
export interface Talk {
  counters: number;
  status: "open" | "accepted" | "declined" | "withdrawn";
  log: TalkEntry[];
}

export interface GameSession {
  pitch: Pitch;
  sharks: Sharks;
  turns: Turn[];
  stage: Stage;
  /** True once the panel has heard enough questions. */
  over: boolean;
  walkouts: Walkout[];
  offers: Offer[];
  outs: { sharkId: SharkId; reason: string }[];
  talks: Partial<Record<SharkId, Talk>>;
  deal: Deal | null;
  debrief: Debrief | null;
}

export type SessionAction =
  | { type: "question"; next: Question }
  | { type: "answered"; answer: string; result: TurnResult }
  | { type: "offers"; result: OffersResult }
  | { type: "accept"; sharkId: SharkId }
  | { type: "decline"; sharkId: SharkId }
  | { type: "countered"; sharkId: SharkId; counter: Terms; result: NegotiateResult }
  | { type: "toDebrief" }
  | { type: "debrief"; debrief: Debrief };

const STORAGE_KEY = "shark-tank:session";
const PREFILL_KEY = "shark-tank:prefill";

export function createSession(pitch: Pitch): GameSession {
  return {
    pitch,
    sharks: createSharks(pitch.difficulty),
    turns: [],
    stage: "questioning",
    over: false,
    walkouts: [],
    offers: [],
    outs: [],
    talks: {},
    deal: null,
    debrief: null,
  };
}

export const answeredTurns = (turns: Turn[]) => turns.filter((t) => t.answer);

function toDeal(offer: Offer): Deal {
  return { sharkId: offer.sharkId, amountLakh: offer.amountLakh, equityPct: offer.equityPct, condition: offer.condition };
}

export function sessionReducer(state: GameSession, action: SessionAction): GameSession {
  switch (action.type) {
    case "question":
      return { ...state, turns: [...state.turns, { ...action.next }] };

    case "answered": {
      const { evaluation, next, sharks, over } = action.result;
      const turns = state.turns.slice();
      const last = turns.length - 1;
      turns[last] = {
        ...turns[last],
        answer: action.answer,
        quality: evaluation?.quality,
        vague: evaluation?.vague,
        reactions: evaluation?.reactions,
      };
      if (next) turns.push({ ...next });
      const answered = answeredTurns(turns).length;
      const walkouts = [...state.walkouts, ...(evaluation?.walkouts ?? []).map((w) => ({ ...w, afterAnswer: answered }))];
      return { ...state, turns, sharks, over, walkouts };
    }

    case "offers": {
      const talks: GameSession["talks"] = {};
      for (const o of action.result.offers) {
        talks[o.sharkId] = { counters: 0, status: "open", log: [{ from: o.sharkId, amountLakh: o.amountLakh, equityPct: o.equityPct, line: o.line }] };
      }
      return { ...state, stage: "deal", offers: action.result.offers, outs: action.result.outs, talks };
    }

    case "accept": {
      const offer = state.offers.find((o) => o.sharkId === action.sharkId);
      const talk = state.talks[action.sharkId];
      if (!offer || !talk || talk.status !== "open") return state;
      return { ...state, stage: "debrief", deal: toDeal(offer), talks: { ...state.talks, [action.sharkId]: { ...talk, status: "accepted" } } };
    }

    case "decline": {
      const talk = state.talks[action.sharkId];
      if (!talk || talk.status !== "open") return state;
      return { ...state, talks: { ...state.talks, [action.sharkId]: { ...talk, status: "declined" } } };
    }

    case "countered": {
      const { sharkId, counter, result } = action;
      const talk = state.talks[sharkId];
      const offer = state.offers.find((o) => o.sharkId === sharkId);
      if (!talk || !offer) return state;
      const log: TalkEntry[] = [
        ...talk.log,
        { from: "founder", ...counter },
        { from: sharkId, amountLakh: result.amountLakh, equityPct: result.equityPct, line: result.line },
      ];
      const counters = talk.counters + 1;
      if (result.response === "walk") {
        return { ...state, talks: { ...state.talks, [sharkId]: { counters, log, status: "withdrawn" } } };
      }
      const updated: Offer = { ...offer, amountLakh: result.amountLakh, equityPct: result.equityPct, line: result.line };
      const offers = state.offers.map((o) => (o.sharkId === sharkId ? updated : o));
      if (result.response === "accept") {
        return { ...state, offers, stage: "debrief", deal: toDeal(updated), talks: { ...state.talks, [sharkId]: { counters, log, status: "accepted" } } };
      }
      return { ...state, offers, talks: { ...state.talks, [sharkId]: { counters, log, status: "open" } } };
    }

    case "toDebrief":
      return { ...state, stage: "debrief" };

    case "debrief":
      return { ...state, debrief: action.debrief };
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode); the game still works for this page view.
  }
}

export const loadSession = () => {
  const s = read<GameSession>(STORAGE_KEY);
  return s && s.pitch && s.sharks && Array.isArray(s.turns) ? s : null;
};
export const saveSession = (session: GameSession) => write(STORAGE_KEY, session);

/** "Pitch again" hands the improved pitch back to the landing form; it stays until the next pitch starts. */
export const savePrefill = (pitch: Pitch) => write(PREFILL_KEY, pitch);
/** Raw JSON string (stable between calls, so it can be a useSyncExternalStore snapshot). */
export function readPrefillRaw(): string | null {
  try {
    return sessionStorage.getItem(PREFILL_KEY);
  } catch {
    return null;
  }
}
export function parsePrefill(raw: string | null): Pitch | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Pitch;
  } catch {
    return null;
  }
}
export function clearPrefill() {
  try {
    sessionStorage.removeItem(PREFILL_KEY);
  } catch {
    // ignore
  }
}
