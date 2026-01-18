import { cn } from "@/lib/utils";
import { WorldState } from "@/types";
import { stopAudio } from "@/utils/audio";
import {
  ChevronLeftIcon,
  HistoryIcon,
  ImageIcon,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import YearOdometer from "./year-odometer";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  worldState: WorldState | null;
  isGeneratingImage: boolean;
  isGeneratingAudio: boolean;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  audioSourceRef: React.RefObject<AudioBufferSourceNode | null>;
}

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  worldState,
  isGeneratingImage,
  isGeneratingAudio,
  audioEnabled,
  setAudioEnabled,
  audioSourceRef,
}: HeaderProps) {
  return (
    <header className="bg-transparent p-4 flex items-center justify-between z-10">
      {/* Sidebar Trigger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex items-center justify-center p-2 rounded bg-ink-900 hover:bg-ink-800 text-accent-gold transition-colors"
      >
        {sidebarOpen ? (
          <ChevronLeftIcon />
        ) : (
          <HistoryIcon className="w-6 h-6" />
        )}
      </button>

      <div
        className={cn("absolute left-1/2 -translate-x-1/2", {
          "top-14": !worldState,
          "top-8": worldState,
        })}
      >
        {worldState ? (
          <YearOdometer value={worldState.year} />
        ) : (
          <div className="flex flex-col items-center opacity-40 text-parchment-100">
            <Timer className="w-6 h-6 mb-1" />
            <span className="text-[10px] uppercase tracking-widest font-bold">
              Awaiting Divergence
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-start gap-1">
          {isGeneratingImage && (
            <div className="flex items-center gap-2 text-xs text-parchment-100 animate-pulse">
              <ImageIcon className="w-3 h-3" />
              <span>Visualizing...</span>
            </div>
          )}
          {isGeneratingAudio && (
            <div className="flex items-center gap-2 text-xs text-parchment-100 animate-pulse">
              <Volume2 className="w-3 h-3" />
              <span>Narrating...</span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            stopAudio(audioSourceRef);
            setAudioEnabled(!audioEnabled);
          }}
          className={`p-2 rounded transition-colors bg-ink-900 ${audioEnabled ? "text-accent-gold hover:bg-ink-800" : "text-parchment-800 hover:bg-ink-800"}`}
        >
          {audioEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
