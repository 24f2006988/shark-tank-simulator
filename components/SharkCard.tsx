import type { Shark } from "@/lib/sharks";
import type { SharkId } from "@/lib/types";
import { SharkFace, type Mood } from "./SharkFace";

/** Small still face for chat notes, offers and the debrief. */
export function SharkAvatar({ shark, size = "md", mood = "neutral" }: { shark: Shark; size?: "sm" | "md"; mood?: Mood }) {
  return <SharkFace shark={shark} mood={mood} size={size === "sm" ? 36 : 52} animated={false} />;
}

/** On the landing page each shark shows their personality. */
const RESTING_MOOD: Record<SharkId, Mood> = { vikram: "neutral", meera: "warm", arjun: "doubtful", zara: "hooked" };

/** Landing-page tile: a large portrait with role, investing lens and bio. The live panel is drawn by `Stage`. */
export function SharkCard({ shark }: { shark: Shark }) {
  return (
    <article className="relative flex h-full flex-col items-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900 px-3 pt-4 pb-5 text-center transition hover:border-slate-600">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${shark.color.bar}`} />
      <div className="seat-spot w-full max-w-48">
        <SharkFace shark={shark} mood={RESTING_MOOD[shark.id]} size="100%" />
      </div>
      <h3 className="mt-2 font-display text-xl leading-tight font-semibold text-slate-100">{shark.name}</h3>
      <p className={`text-sm font-semibold ${shark.color.text}`}>{shark.title}</p>
      <p className="mt-1 text-xs tracking-wide text-slate-400 uppercase">Lens: {shark.lensLabel}</p>
      <p className="mt-2 text-sm text-pretty text-slate-300">{shark.bio}</p>
    </article>
  );
}
