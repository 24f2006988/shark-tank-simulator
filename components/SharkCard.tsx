import type { Shark } from "@/lib/sharks";
import type { SharkId } from "@/lib/types";
import { SharkFace, type Mood } from "./SharkFace";

/** Small still face for chat notes, offers and the debrief. */
export function SharkAvatar({ shark, size = "md", mood = "neutral" }: { shark: Shark; size?: "sm" | "md"; mood?: Mood }) {
  return <SharkFace shark={shark} mood={mood} size={size === "sm" ? 36 : 52} animated={false} />;
}

/** On the landing page each shark shows their personality. */
const RESTING_MOOD: Record<SharkId, Mood> = { vikram: "neutral", meera: "warm", arjun: "doubtful", zara: "hooked" };

/** The panel seated behind the desk in the landing hero: big portraits with a nameplate each. */
export function SeatedPanel({ sharks }: { sharks: Shark[] }) {
  return (
    <div className="tank-set relative overflow-hidden rounded-2xl border border-slate-800 px-3 pt-5 pb-5 sm:px-6 sm:pt-8 sm:pb-3">
      <ul aria-label="The panel" className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-5">
        {sharks.map((shark) => (
          <li key={shark.id} className="flex flex-col items-center text-center">
            <div className="seat-spot w-full max-w-64">
              <SharkFace shark={shark} mood={RESTING_MOOD[shark.id]} size="100%" />
            </div>
            <p className="relative z-20 -mt-1 w-full max-w-52 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 shadow-[var(--shadow)] sm:px-3">
              <span className="block truncate font-display text-base leading-tight font-semibold text-slate-100 sm:text-lg">{shark.name}</span>
              <span className={`block truncate text-xs font-semibold sm:text-sm ${shark.color.text}`}>{shark.title}</span>
            </p>
          </li>
        ))}
      </ul>
      {/* The desk the panel sits behind. */}
      <div aria-hidden="true" className="relative -mt-6 hidden h-10 rounded-lg border-t border-slate-600 bg-slate-800 sm:block" />
    </div>
  );
}

/** "Meet the panel" bio card: a small portrait beside the investor's lens and background. */
export function SharkCard({ shark }: { shark: Shark }) {
  return (
    <article className="relative flex h-full gap-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-4 pl-5 transition hover:border-slate-600">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${shark.color.bar}`} />
      <SharkFace shark={shark} mood={RESTING_MOOD[shark.id]} size={72} animated={false} />
      <div className="min-w-0">
        <h3 className="font-display text-xl leading-tight font-semibold text-slate-100">{shark.name}</h3>
        <p className={`text-sm font-semibold ${shark.color.text}`}>{shark.title}</p>
        <p className="mt-1 text-xs tracking-wide text-slate-400 uppercase">Lens: {shark.lensLabel}</p>
        <p className="mt-2 text-sm text-pretty text-slate-300">{shark.bio}</p>
      </div>
    </article>
  );
}
