import type { Emote, EmoteKind } from "./emotes";

/** Badge colour and glyph per exclamation. Colours come from the theme, so contrast holds in light and dark. */
const BADGE: Record<EmoteKind, { glyph: string; className: string }> = {
  exclaim: { glyph: "!", className: "bg-amber-300" },
  star: { glyph: "★", className: "bg-accent" },
  question: { glyph: "?", className: "bg-slate-400" },
  anger: { glyph: "✖", className: "bg-rose-300" },
  dots: { glyph: "…", className: "bg-slate-400" },
};

/** A small badge and a short word popping beside a shark's head. Decorative: the shark's spoken line carries the content. */
export function FaceEmote({ emote }: { emote: Emote }) {
  const badge = BADGE[emote.kind];
  return (
    <div aria-hidden="true" className="emote-pop pointer-events-none absolute top-0 right-[2%] z-10 flex flex-col items-center gap-1">
      <span className={`grid size-8 place-items-center rounded-full text-lg font-extrabold text-slate-950 shadow-sm sm:size-11 sm:text-2xl ${badge.className}`}>{badge.glyph}</span>
      <span className="rounded-full border border-slate-600 bg-slate-950 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-slate-100 shadow-sm">{emote.word}</span>
    </div>
  );
}
