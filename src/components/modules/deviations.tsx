import { WorldState } from "@/types";
import { AlertTriangle, Globe } from "lucide-react";

interface DeviationsProps {
  deviations?: WorldState["deviations"];
  isLoading: boolean;
}

export default function Deviations({ deviations, isLoading }: DeviationsProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto relative">
      {isLoading && (
        <div className="absolute inset-0 bg-parchment-200/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="animate-pulse text-ink-800 font-display text-xl">
            Calculating Ripples...
          </div>
        </div>
      )}
      {deviations && (
        <div className="flex-1 bg-parchment-200/50 rounded-sm p-2">
          <div className="flex items-center gap-2 mb-3 border-b border-ink-800/10 pb-1">
            <Globe className="w-4 h-4 text-ink-600" />
            <h3 className="font-display font-bold text-ink-800">
              Recorded Deviations
            </h3>
          </div>
          <ul className="space-y-3">
            {deviations.map((deviation, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-ink-800 font-serif leading-snug text-sm bg-parchment-100 p-2 rounded border-l-2 border-accent-gold"
              >
                <AlertTriangle className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
                <span>{deviation}</span>
              </li>
            ))}
            {deviations.length === 0 && (
              <li className="text-ink-600 italic font-serif text-sm">
                No significant divergences recorded yet.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
