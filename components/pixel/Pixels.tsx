import { runsToPaths, type Run } from "./sprites";

/** Draws sprite runs as one path per colour: the same pixels as a rect per run, with a fraction of the DOM nodes. */
export function Pixels({ runs }: { runs: Run[] }) {
  return (
    <>
      {runsToPaths(runs).map((p) => (
        <path key={p.c} d={p.d} fill={p.c} />
      ))}
    </>
  );
}
