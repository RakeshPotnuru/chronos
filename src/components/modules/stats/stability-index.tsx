import { WorldState } from "@/types";

export default function StabilityIndex({
  geopolitical_stability,
}: Pick<WorldState, "geopolitical_stability">) {
  return (
    <div className="bg-parchment-100 border border-parchment-800/30 p-3 rounded">
      <p className="text-xs font-bold uppercase text-ink-600 mb-1">
        Stability Index
      </p>
      <p className="font-serif text-lg text-ink-800">
        {geopolitical_stability}/100
      </p>
    </div>
  );
}
