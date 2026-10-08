import { btn, card } from "./ui";

interface Props {
  /** Every shark has walked out, so there is nobody left to make an offer. */
  noneLeft: boolean;
  busy: boolean;
  onOffers: () => void;
  onDebrief: () => void;
}

/** What the founder sees once questioning is over: hear the offers, or go straight to feedback if the panel is gone. */
export function QuestionsDone({ noneLeft, busy, onOffers, onDebrief }: Props) {
  return (
    <div className={`${card} flex flex-col gap-3 p-5`}>
      <p className="font-semibold">
        {noneLeft
          ? "Every shark has walked out, so there are no offers this time. The feedback will show you exactly why."
          : "The panel has heard enough. Time to see who wants in."}
      </p>
      <div className="flex flex-wrap gap-2">
        {noneLeft ? (
          <button type="button" onClick={onDebrief} disabled={busy} className={btn.primary}>
            See your debrief
          </button>
        ) : (
          <button type="button" onClick={onOffers} disabled={busy} className={btn.primary}>
            Hear the offers
          </button>
        )}
      </div>
    </div>
  );
}
