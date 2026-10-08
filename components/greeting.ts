import { formatInr } from "@/lib/game";
import type { Pitch } from "@/lib/types";
import type { LineInput } from "./useScript";

/** The panel welcomes the founder before the first question. Scripted, so it costs no extra API call. */
export function greetingScript(pitch: Pick<Pitch, "ideaName" | "askLakh" | "equityPct">): LineInput[] {
  const ask = `${formatInr(pitch.askLakh)} for ${pitch.equityPct} percent`;
  return [
    { sharkId: "vikram", text: `Welcome to the tank. I'm Vikram Rao. ${pitch.ideaName}, asking ${ask}. I'll be checking the numbers.`, kind: "greeting" },
    { sharkId: "meera", text: "Meera Iyer here. I want to know who actually pays you, and why they come back.", kind: "greeting" },
    { sharkId: "arjun", text: "Arjun Mehta. I'll be hunting for the hole in the plan, so be ready.", kind: "greeting" },
    { sharkId: "zara", text: "And I'm Zara Khan. Convince me you're the one to win this. Take a breath, and begin.", kind: "greeting" },
  ];
}
