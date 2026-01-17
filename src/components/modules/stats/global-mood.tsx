import { WorldState } from "@/types";

export default function GlobalMood({
  population_mood,
}: Pick<WorldState, "population_mood">) {
  return (
    <div className="bg-parchment-100 border border-parchment-800/30 p-3 rounded">
      <p className="text-xs font-bold uppercase text-ink-600 mb-1">
        Global Mood
      </p>
      <p className="font-serif italic text-lg text-ink-800">
        {population_mood}
      </p>
    </div>
  );
}
