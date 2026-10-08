import { describe, expect, it } from "vitest";
import { greetingScript } from "@/components/greeting";
import { SHARK_IDS } from "@/lib/schemas";

describe("greetingScript", () => {
  const lines = greetingScript({ ideaName: "ChaiBot", askLakh: 50, equityPct: 10 });

  it("has one greeting per shark, in panel order", () => {
    expect(lines.map((l) => l.sharkId)).toEqual([...SHARK_IDS]);
    expect(lines.every((l) => l.kind === "greeting" && l.text.trim().length > 0)).toBe(true);
  });

  it("names the idea and the ask", () => {
    expect(lines[0].text).toContain("ChaiBot");
    expect(lines[0].text).toContain("10 percent");
  });
});
