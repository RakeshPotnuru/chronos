"use client";

import { CheckpointEvaluation, MarathonSession } from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Pause,
  Play,
  Square,
  Target,
  Zap,
  VolumeX,
  Volume2,
} from "lucide-react";
import { useRef, useState } from "react";

interface MarathonProgressProps {
  session: MarathonSession;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isExecutingStep: boolean;
}

export default function MarathonProgress({
  session,
  onPause,
  onResume,
  onStop,
  isExecutingStep,
}: MarathonProgressProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [playingAudioStep, setPlayingAudioStep] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const progressPercent =
    (session.steps.length / session.config.max_steps) * 100;

  const checkpoints = session.steps.filter((s) => s.checkpoint);

  const getStatusColor = () => {
    switch (session.status) {
      case "running":
        return "text-green-500";
      case "paused":
        return "text-yellow-500";
      case "completed":
        return "text-accent-gold";
      case "failed":
        return "text-red-500";
      default:
        return "text-ink-900/50";
    }
  };

  const getStatusIcon = () => {
    switch (session.status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const toggleAudio = (stepNumber: number, audioData?: string) => {
    if (!audioData) return;

    if (playingAudioStep === stepNumber) {
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudioStep(null);
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Play new audio
      const audio = new Audio(audioData);
      audio.onended = () => setPlayingAudioStep(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudioStep(stepNumber);
    }
  };

  return (
    <div className="bg-ink-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-accent-gold/20 overflow-hidden">
      {/* Header */}
      <div className="bg-ink-800 px-4 py-3 border-b border-ink-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent-gold" />
            <div>
              <h3 className="font-serif font-bold text-parchment-100">
                Mission: {session.config.goal.description}
              </h3>
              <div
                className={`flex items-center gap-1.5 text-xs ${getStatusColor()}`}
              >
                {getStatusIcon()}
                <span className="uppercase tracking-wider font-bold">
                  {session.status}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {session.status === "running" && (
              <button
                onClick={onPause}
                className="p-2 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                title="Pause Mission"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            {session.status === "paused" && (
              <button
                onClick={onResume}
                className="p-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                title="Resume Mission"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {(session.status === "running" || session.status === "paused") && (
              <button
                onClick={onStop}
                className="p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Abort Mission"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-ink-700">
        <div className="flex items-center justify-between text-xs text-parchment-100/70 mb-2">
          <span>
            Step {session.steps.length} of {session.config.max_steps}
          </span>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>
        <div className="h-2 bg-ink-700 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-linear-to-r from-accent-gold to-yellow-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Checkpoint markers */}
          {Array.from({
            length: Math.floor(
              session.config.max_steps / session.config.checkpoint_interval,
            ),
          }).map((_, i) => {
            const checkpointStep = (i + 1) * session.config.checkpoint_interval;
            const position = (checkpointStep / session.config.max_steps) * 100;
            const isReached = session.steps.length >= checkpointStep;
            return (
              <div
                key={i}
                className={`absolute top-0 bottom-0 w-0.5 ${
                  isReached ? "bg-green-400" : "bg-ink-600"
                }`}
                style={{ left: `${position}%` }}
                title={`Checkpoint at step ${checkpointStep}`}
              />
            );
          })}
        </div>
      </div>

      {/* Current Step Preview */}
      {isExecutingStep && (
        <div className="px-4 py-3 border-b border-ink-700 bg-ink-800/50">
          <div className="flex items-center gap-2 text-accent-gold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-bold">
              Executing step {session.steps.length + 1}...
            </span>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="max-h-64 overflow-y-auto">
        {session.steps.length === 0 && !isExecutingStep && (
          <div className="px-4 py-6 text-center text-parchment-100/50 text-sm">
            Waiting to start...
          </div>
        )}
        {session.steps
          .slice()
          .reverse()
          .map((step) => (
            <div
              key={step.step_number}
              className="border-b border-ink-700/50 last:border-b-0"
            >
              <button
                onClick={() => toggleStep(step.step_number)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-ink-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded">
                    #{step.step_number}
                  </span>
                  <span className="text-sm text-parchment-100 truncate max-w-[200px]">
                    {step.user_input.slice(0, 50)}...
                  </span>
                  {step.checkpoint && (
                    <Target
                      className={`w-4 h-4 ${
                        step.checkpoint.on_track
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    />
                  )}
                </div>
                {expandedSteps.has(step.step_number) ? (
                  <ChevronUp className="w-4 h-4 text-parchment-100/50" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-parchment-100/50" />
                )}
              </button>

              {expandedSteps.has(step.step_number) && (
                <div className="px-4 py-3 bg-ink-800/30 text-sm space-y-3">
                  {/* Background Image */}
                  {step.background_image && (
                    <div className="rounded overflow-hidden border border-accent-gold/20">
                      <img
                        src={step.background_image}
                        alt={`Step ${step.step_number} visualization`}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-parchment-100/50 uppercase tracking-wider mb-1">
                      Intervention
                    </div>
                    <p className="text-parchment-100/80">{step.user_input}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-parchment-100/50 uppercase tracking-wider">
                        Outcome
                      </div>
                      {step.audio_data && (
                        <button
                          onClick={() =>
                            toggleAudio(step.step_number, step.audio_data)
                          }
                          className={`p-1 rounded transition-colors ${
                            playingAudioStep === step.step_number
                              ? "bg-accent-gold/20 text-accent-gold"
                              : "bg-ink-700/50 text-parchment-100/50 hover:text-accent-gold"
                          }`}
                          title={
                            playingAudioStep === step.step_number
                              ? "Stop audio"
                              : "Play narration"
                          }
                        >
                          {playingAudioStep === step.step_number ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-parchment-100/80 line-clamp-3">
                      {step.simulation_response.narrative.slice(0, 200)}...
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-accent-gold">
                      Year: {step.simulation_response.world_state_update.year}
                    </span>
                    <span className="text-red-400">
                      Chaos:{" "}
                      {step.simulation_response.world_state_update.chaos_level}%
                    </span>
                    <span className="text-green-400">
                      Stability:{" "}
                      {
                        step.simulation_response.world_state_update
                          .geopolitical_stability
                      }
                      %
                    </span>
                  </div>
                  {step.checkpoint && (
                    <CheckpointCard checkpoint={step.checkpoint} />
                  )}
                  {step.correction_applied && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                      <div className="text-xs text-yellow-400 uppercase tracking-wider mb-1">
                        Correction Applied
                      </div>
                      <p className="text-yellow-200/80">
                        {step.correction_applied}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Final Evaluation */}
      {session.status === "completed" && session.final_evaluation && (
        <div className="px-4 py-3 bg-accent-gold/10 border-t border-accent-gold/30">
          <div className="text-xs text-accent-gold uppercase tracking-wider mb-2 font-bold">
            Final Evaluation
          </div>
          <p className="text-sm text-parchment-100/90 whitespace-pre-wrap">
            {session.final_evaluation}
          </p>
        </div>
      )}

      {/* Error message */}
      {session.status === "failed" && session.error_message && (
        <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/30">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{session.error_message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckpointCard({ checkpoint }: { checkpoint: CheckpointEvaluation }) {
  return (
    <div
      className={`rounded p-3 ${
        checkpoint.on_track
          ? "bg-green-500/10 border border-green-500/30"
          : "bg-yellow-500/10 border border-yellow-500/30"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target
            className={`w-4 h-4 ${
              checkpoint.on_track ? "text-green-400" : "text-yellow-400"
            }`}
          />
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              checkpoint.on_track ? "text-green-400" : "text-yellow-400"
            }`}
          >
            Checkpoint #{checkpoint.step_number}
          </span>
        </div>
        <div
          className={`text-lg font-bold ${
            checkpoint.progress_score >= 70
              ? "text-green-400"
              : checkpoint.progress_score >= 40
                ? "text-yellow-400"
                : "text-red-400"
          }`}
        >
          {checkpoint.progress_score}%
        </div>
      </div>
      <p
        className={`text-sm ${
          checkpoint.on_track ? "text-green-200/80" : "text-yellow-200/80"
        }`}
      >
        {checkpoint.deviation_analysis}
      </p>
      {checkpoint.recommended_correction && (
        <div className="mt-2 pt-2 border-t border-current/20">
          <div className="text-xs opacity-70 uppercase tracking-wider mb-1">
            Recommended Correction
          </div>
          <p className="text-sm">{checkpoint.recommended_correction}</p>
        </div>
      )}
    </div>
  );
}
