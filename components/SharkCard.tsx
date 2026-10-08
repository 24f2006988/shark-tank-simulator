import type { Shark } from "@/lib/sharks";
import type { SharkId } from "@/lib/types";
import { SharkFace, type Mood } from "./SharkFace";

/** Small still face for chat bubbles, offers and the debrief. */
export function SharkAvatar({ shark, size = "md", mood = "neutral" }: { shark: Shark; size?: "sm" | "md"; mood?: Mood }) {
  return <SharkFace shark={shark} mood={mood} size={size === "sm" ? 36 : 52} animated={false} />;
}

/** On the landing page each shark shows their personality. */
const RESTING_MOOD: Record<SharkId, Mood> = { vikram: "neutral", meera: "warm", arjun: "doubtful", zara: "hooked" };

/** Landing-page card: portrait, role, investing lens and bio. The live panel is drawn by `Stage`. */
export function SharkCard({ shark }: { shark: Shark }) {
  return (
    <article className="h-full rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center gap-3">
        <SharkFace shark={shark} mood={RESTING_MOOD[shark.id]} size={84} />
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight font-semibold text-slate-100">{shark.name}</h3>
          <p className={`text-sm font-medium ${shark.color.text}`}>{shark.title}</p>
        </div>
      </div>
      <p className="mt-2 text-xs tracking-wide text-slate-300 uppercase">Lens: {shark.lensLabel}</p>
      <p className="mt-2 text-sm text-slate-300">{shark.bio}</p>
    </article>
  );
}
