import { describe, expect, it } from "vitest";
import { offerScript, reactionScript } from "@/components/Tank";
import type { OffersResult, TurnResult } from "@/lib/types";
import { makeSharks } from "./helpers";

const result = (over: Partial<TurnResult> = {}): TurnResult => ({
  evaluation: {
    quality: 4,
    vague: false,
    reactions: [
      { sharkId: "vikram", delta: 6, line: "Those margins hold up." },
      { sharkId: "meera", delta: -12, line: "Who actually pays?" },
      { sharkId: "arjun", delta: 3, line: "Fine." },
      { sharkId: "zara", delta: 9, line: "I like the energy." },
    ],
    walkouts: [],
  },
  sharks: makeSharks(),
  next: { sharkId: "arjun", question: "What stops a copycat?", probing: "defensibility", isFollowUp: false },
  over: false,
  ...over,
});

describe("reactionScript", () => {
  it("plays the asker, then the most moved other shark, then the next question", () => {
    const lines = reactionScript(result(), "vikram");
    expect(lines.map((l) => [l.sharkId, l.kind])).toEqual([
      ["vikram", "reaction"],
      ["meera", "reaction"],
      ["arjun", "question"],
    ]);
    expect(lines[2]).toMatchObject({ text: "What stops a copycat?", probing: "defensibility", followUp: false });
  });

  it("skips small bystander reactions (under 8 points)", () => {
    const r = result();
    r.evaluation!.reactions = r.evaluation!.reactions.map((x) => (x.sharkId === "vikram" ? x : { ...x, delta: 5 }));
    expect(reactionScript(r, "vikram").filter((l) => l.kind === "reaction")).toHaveLength(1);
  });

  it("lets a walking-out shark give their reason instead of a reaction", () => {
    const r = result({ next: null, over: true });
    r.evaluation!.walkouts = [{ sharkId: "meera", reason: "I can't see who buys this. I'm out." }];
    const lines = reactionScript(r, "meera");
    expect(lines).toEqual([
      { sharkId: "zara", text: "I like the energy.", kind: "reaction" },
      { sharkId: "meera", text: "I can't see who buys this. I'm out.", kind: "out" },
    ]);
  });

  it("is empty for the opening turn with no evaluation and no question", () => {
    expect(reactionScript(result({ evaluation: null, next: null }), "vikram")).toEqual([]);
  });
});

describe("offerScript", () => {
  it("announces each offer with its terms and lets sharks still in explain why they pass", () => {
    const sharks = makeSharks();
    sharks.arjun.status = "out";
    const offers: OffersResult = {
      offers: [{ sharkId: "vikram", amountLakh: 50, equityPct: 12, line: "Here's my offer.", condition: "" }],
      outs: [
        { sharkId: "zara", reason: "Not for me." },
        { sharkId: "arjun", reason: "Already gone." },
      ],
    };
    expect(offerScript(offers, sharks)).toEqual([
      { sharkId: "vikram", text: "Here's my offer. Rs 50 lakh for 12 percent.", kind: "offer" },
      { sharkId: "zara", text: "Not for me.", kind: "out" },
    ]);
  });
});
