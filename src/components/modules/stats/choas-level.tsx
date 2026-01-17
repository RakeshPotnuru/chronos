import { WorldState } from "@/types";
import { Activity } from "lucide-react";

export default function ChaosLevel({
  chaos_level,
}: Pick<WorldState, "chaos_level">) {
  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      <div className="border-2 border-ink-800/20 p-4 rounded-sm bg-parchment-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="w-12 h-12 text-accent-red" />
        </div>
        <p className="text-ink-600 text-sm font-bold uppercase tracking-widest">
          Chaos Level (Entropy)
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-display text-accent-red">
            {chaos_level}%
          </p>
        </div>
        {/* Chaos Bar */}
        <div className="w-full h-1 bg-parchment-300 mt-2">
          <div
            className="h-full bg-accent-red transition-all duration-1000"
            style={{ width: `${chaos_level}%` }}
          />
        </div>
      </div>
    </div>
  );
}
