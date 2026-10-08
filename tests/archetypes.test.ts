import { describe, expect, it } from "vitest";
import { systemPrompt } from "@/lib/prompts";
import { ALL_ARCHETYPE_IDS, pitchSchema } from "@/lib/schemas";
import { SHARK_ARCHETYPES, SHARKS, resolvePanel, resolveShark } from "@/lib/sharks";
import type { SharkCustomization } from "@/lib/types";

describe("Shark Archetypes and Resolution", () => {
  it("provides 3 rich archetypes for every shark", () => {
    for (const [, archetypes] of Object.entries(SHARK_ARCHETYPES)) {
      expect(archetypes).toHaveLength(3);
      for (const a of archetypes) {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.role).toBeTruthy();
        expect(a.lens).toBeTruthy();
        expect(a.tagline).toBeTruthy();
        expect(a.style).toBeTruthy();
      }
    }
  });

  it("returns the default shark when no customization is provided", () => {
    const s = resolveShark("vikram");
    expect(s.title).toBe("The Numbers");
    expect(s.lens).toBe("economics");
    expect(s.style).toBe(SHARKS.vikram.style);
  });

  it("resolves an archetype by archetypeId", () => {
    const custom: SharkCustomization = { archetypeId: "growth" };
    const s = resolveShark("vikram", custom);
    expect(s.title).toBe("The Growth Hacker");
    expect(s.role).toBe("SaaS Scale Partner");
    expect(s.lens).toBe("economics");
    expect(s.style).toContain("cohort retention");
  });

  it("safely falls back to base shark when unknown archetypeId is passed", () => {
    const s = resolveShark("vikram", { archetypeId: "unknown_id" as unknown as (typeof ALL_ARCHETYPE_IDS)[number] });
    expect(s.title).toBe("The Numbers");
    expect(s.role).toBe("Ex-investment banker");
    expect(s.style).toBe(SHARKS.vikram.style);
  });

  it("resolvePanel maps all 4 sharks with individual settings", () => {
    const panel = resolvePanel({
      vikram: { archetypeId: "growth" },
      zara: { archetypeId: "esg" },
    });
    expect(panel.vikram.title).toBe("The Growth Hacker");
    expect(panel.meera.title).toBe("The Customer"); // default
    expect(panel.arjun.title).toBe("The Skeptic"); // default
    expect(panel.zara.title).toBe("The Impact Champion");
    expect(panel.zara.lens).toBe("market");
  });

  it("systemPrompt incorporates customized shark titles and styles", () => {
    const prompt = systemPrompt("realistic", {
      vikram: { archetypeId: "growth" },
      meera: { archetypeId: "enterprise" },
    });
    expect(prompt).toContain("The Growth Hacker");
    expect(prompt).toContain("cohort retention");
    expect(prompt).toContain("The Enterprise Vet");
    expect(prompt).toContain("annual contract values");
  });

  it("validates pitch with valid customPanels", () => {
    const res = pitchSchema.safeParse({
      ideaName: "SmartDrone",
      askLakh: 50,
      equityPct: 10,
      description: "Autonomous delivery drones for emergency medical supplies in rural areas with verified payload locks.",
      difficulty: "realistic",
      customPanels: {
        vikram: { archetypeId: "growth" },
        arjun: { archetypeId: "architect" },
      },
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.customPanels?.vikram?.archetypeId).toBe("growth");
    }
  });

  it("rejects invalid archetype IDs in pitchSchema", () => {
    const res = pitchSchema.safeParse({
      ideaName: "SmartDrone",
      askLakh: 50,
      equityPct: 10,
      description: "Autonomous delivery drones for emergency medical supplies in rural areas with verified payload locks.",
      difficulty: "realistic",
      customPanels: {
        vikram: { archetypeId: "customer" },
      },
    });
    expect(res.success).toBe(false);
  });
});
