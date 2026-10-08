export function interestWord(value: number): string {
  if (value < 20) return "cold";
  if (value < 40) return "doubtful";
  if (value < 60) return "listening";
  if (value < 80) return "warming up";
  return "hooked";
}

interface Props {
  name: string;
  value: number;
  /** Change from the latest answer; shown as an arrow and text, never colour alone. */
  delta?: number;
  barClass: string;
  /** Slim version for the stage seats: just the bar and the number. */
  compact?: boolean;
}

export function InterestMeter({ name, value, delta, barClass, compact = false }: Props) {
  const v = Math.round(value);
  const word = interestWord(v);
  const change = delta ? `${delta > 0 ? "up" : "down"} ${Math.abs(delta)}` : "";
  const deltaBadge = delta ? (
    <span className={`ml-1.5 font-semibold ${delta > 0 ? "text-emerald-300" : "text-rose-300"}`}>
      <span aria-hidden="true">{delta > 0 ? "▲" : "▼"}</span>
      {Math.abs(delta)}
    </span>
  ) : null;
  return (
    <div>
      {compact ? null : (
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-300">Interest</span>
          <span className="font-mono text-slate-100">
            {v}
            <span className="text-slate-400">/100</span>
            {deltaBadge}
          </span>
        </div>
      )}
      <div
        role="meter"
        aria-label={`${name}'s interest`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        aria-valuetext={`${name}: ${v} out of 100, ${word}${change ? `, ${change}` : ""}`}
        className={`overflow-hidden rounded-full bg-slate-800 ${compact ? "h-1.5" : "mt-1 h-2.5"}`}
      >
        <div className={`h-full rounded-full transition-[width] duration-500 ${barClass}`} style={{ width: `${v}%` }} />
      </div>
      {compact ? (
        <p className="mt-0.5 font-mono text-xs text-slate-300">
          {v}
          {deltaBadge}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-400 capitalize">{word}</p>
      )}
    </div>
  );
}
