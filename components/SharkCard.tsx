import type { Shark } from "@/lib/sharks";
import type { SharkId } from "@/lib/types";
import { SharkFace, type Mood } from "./SharkFace";

/** Small still face for chat notes, offers and the debrief. */
export function SharkAvatar({ shark, size = "md", mood = "neutral" }: { shark: Shark; size?: "sm" | "md"; mood?: Mood }) {
  return <SharkFace shark={shark} mood={mood} size={size === "sm" ? 36 : 52} animated={false} />;
}

/** Before a pitch each shark shows their personality. */
export const RESTING_MOOD: Record<SharkId, Mood> = { vikram: "neutral", meera: "warm", arjun: "doubtful", zara: "hooked" };
