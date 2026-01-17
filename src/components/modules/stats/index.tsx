import { WorldState } from "@/types";
import ChaosLevel from "./choas-level";
import GlobalMood from "./global-mood";
import StabilityIndex from "./stability-index";

interface StatsProps {
  state: WorldState | null;
  isLoading: boolean;
}

export default function Stats({ state, isLoading }: StatsProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto relative">
      {isLoading && (
        <div className="absolute inset-0 bg-parchment-200/50 z-10 rounded-sm flex items-center justify-center backdrop-blur-[1px]">
          <div className="animate-pulse text-ink-800 font-display text-xl">
            Calculating Ripples...
          </div>
        </div>
      )}
      {state && (
        <div className="flex flex-col gap-4">
          <ChaosLevel {...state} />
          <GlobalMood {...state} />
          <StabilityIndex {...state} />
        </div>
      )}
    </div>
  );
}
