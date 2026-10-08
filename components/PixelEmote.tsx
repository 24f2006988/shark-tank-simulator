import type { Emote } from "./emotes";
import { Pixels } from "./pixel/Pixels";
import { EMOTE_GRID, buildEmote } from "./pixel/sprites";

/** A pixel icon and a short word popping above a shark's head. Decorative: the shark's spoken line carries the content. */
export function PixelEmote({ emote }: { emote: Emote }) {
  return (
    <div aria-hidden="true" className="emote-pop pointer-events-none absolute top-0 right-[4%] z-10 flex flex-col items-center gap-0.5">
      <svg viewBox={`0 0 ${EMOTE_GRID} ${EMOTE_GRID}`} shapeRendering="crispEdges" className="size-8 sm:size-12">
        <Pixels runs={buildEmote(emote.kind)} />
      </svg>
      <span className="rounded-sm border-2 border-[#2a1c16] bg-white px-1.5 font-mono text-[10px] font-bold whitespace-nowrap text-[#2a1c16] sm:text-xs">
        {emote.word}
      </span>
    </div>
  );
}
