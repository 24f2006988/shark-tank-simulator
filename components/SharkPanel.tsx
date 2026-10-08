import { SHARK_IDS } from "@/lib/schemas";
import { SHARKS } from "@/lib/sharks";
import type { Reaction, SharkId, Sharks } from "@/lib/types";
import { SharkCard } from "./SharkCard";

interface Props {
  sharks: Sharks;
  asking?: SharkId | null;
  lastReactions?: Reaction[];
}

export function SharkPanel({ sharks, asking = null, lastReactions = [] }: Props) {
  return (
    <section aria-labelledby="panel-heading">
      <h2 id="panel-heading" className="sr-only">
        The panel
      </h2>
      <ul className="grid grid-cols-2 gap-3">
        {SHARK_IDS.map((id) => (
          <li key={id}>
            <SharkCard
              shark={SHARKS[id]}
              state={sharks[id]}
              asking={asking === id}
              delta={lastReactions.find((r) => r.sharkId === id)?.delta}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
