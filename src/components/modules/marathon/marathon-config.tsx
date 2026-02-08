"use client";

import { GoalPreset, MarathonConfig, MarathonGoal } from "@/types";
import { Clock, Play, RefreshCw, Settings, Target, X, Zap } from "lucide-react";
import { useState } from "react";

interface MarathonConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMarathon: (config: MarathonConfig) => void;
}

const OPTIMIZATION_OPTIONS = [
  { value: "stability", label: "Maximize Stability", icon: "⚖️" },
  { value: "peace", label: "Maximize Peace", icon: "🕊️" },
  { value: "chaos", label: "Embrace Chaos", icon: "🌀" },
];

const GOAL_PRESETS: Record<string, GoalPreset> = {
  prevent_wwi: {
    description: "Prevent World War I",
    success_criteria:
      "No major European war by 1920, Archduke Franz Ferdinand survives or diplomatic channels prevent escalation",
    target_year: 1920,
    optimization_metric: "peace",
  },
  maximize_stability: {
    description: "Maximize global stability by 1950",
    success_criteria:
      "Geopolitical stability above 70%, minimal chaos level, no world wars",
    target_year: 1950,
    optimization_metric: "stability",
  },
  prevent_wwii: {
    description: "Prevent World War II",
    success_criteria:
      "No major global conflict by 1945, Nazi Germany does not rise to power or is contained diplomatically",
    target_year: 1945,
    optimization_metric: "peace",
  },
  cold_war_resolution: {
    description: "Peacefully resolve the Cold War by 1970",
    success_criteria:
      "US-Soviet tensions de-escalate, no nuclear standoffs, cooperation frameworks established",
    target_year: 1970,
    optimization_metric: "peace",
  },
  accelerate_technology: {
    description: "Accelerate technological progress",
    success_criteria:
      "Major technological breakthroughs happen earlier, space exploration advanced, computing revolution accelerated",
    target_year: 2000,
    optimization_metric: "stability",
  },
  prevent_2008_financial_crisis: {
    description: "Prevent the 2008 financial crisis",
    success_criteria:
      "No major financial crisis by 2008, Lehman Brothers does not collapse or is bailed out",
    target_year: 2008,
    optimization_metric: "stability",
  },
};

export default function MarathonConfigModal({
  isOpen,
  onClose,
  onStartMarathon,
}: MarathonConfigModalProps) {
  const [presets] = useState<Record<string, GoalPreset>>(GOAL_PRESETS);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState<MarathonGoal>({
    description: "",
    success_criteria: "",
    target_year: undefined,
    optimization_metric: "stability",
  });
  const [maxSteps, setMaxSteps] = useState(10);
  const [checkpointInterval, setCheckpointInterval] = useState(3);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [startingDivergence, setStartingDivergence] = useState("");

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = presets[presetKey];
    if (preset) {
      setCustomGoal({
        description: preset.description,
        success_criteria: preset.success_criteria,
        target_year: preset.target_year,
        optimization_metric: preset.optimization_metric,
      });
    }
  };

  const handleStart = () => {
    if (!customGoal.description || !customGoal.success_criteria) {
      return;
    }

    const config: MarathonConfig = {
      goal: customGoal,
      max_steps: maxSteps,
      checkpoint_interval: checkpointInterval,
      auto_correct: autoCorrect,
      starting_divergence: startingDivergence || undefined,
    };

    onStartMarathon(config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-parchment-100 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-ink-900/20">
        {/* Header */}
        <div className="sticky top-0 bg-ink-900 text-parchment-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-accent-gold" />
            <div>
              <h2 className="text-xl font-serif font-bold">
                Autonomous Mission
              </h2>
              <p className="text-xs text-parchment-100/70">
                Configure an autonomous mission plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ink-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Goal Presets */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900/70 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Quick Start Goals
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedPreset === key
                      ? "border-accent-gold bg-accent-gold/10"
                      : "border-ink-900/10 hover:border-ink-900/30"
                  }`}
                >
                  <div className="font-serif font-bold text-ink-900">
                    {preset.description}
                  </div>
                  <div className="text-xs text-ink-900/60 mt-1">
                    Target: {preset.target_year || "Open"}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Custom Goal */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900/70 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Goal Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">
                  Goal Description
                </label>
                <input
                  type="text"
                  value={customGoal.description}
                  onChange={(e) =>
                    setCustomGoal({
                      ...customGoal,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g., Prevent World War I"
                  className="w-full px-4 py-2 rounded border border-ink-900/20 bg-white focus:outline-none focus:border-accent-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink-900 mb-1">
                  Success Criteria
                </label>
                <textarea
                  value={customGoal.success_criteria}
                  onChange={(e) =>
                    setCustomGoal({
                      ...customGoal,
                      success_criteria: e.target.value,
                    })
                  }
                  placeholder="e.g., No major European war by 1920"
                  rows={2}
                  className="w-full px-4 py-2 rounded border border-ink-900/20 bg-white focus:outline-none focus:border-accent-gold resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-1">
                    Target Year
                  </label>
                  <input
                    type="number"
                    value={customGoal.target_year || ""}
                    onChange={(e) =>
                      setCustomGoal({
                        ...customGoal,
                        target_year: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="e.g., 1920"
                    className="w-full px-4 py-2 rounded border border-ink-900/20 bg-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-1">
                    Optimize For
                  </label>
                  <select
                    value={customGoal.optimization_metric || "stability"}
                    onChange={(e) =>
                      setCustomGoal({
                        ...customGoal,
                        optimization_metric: e.target.value as
                          | "stability"
                          | "chaos"
                          | "peace",
                      })
                    }
                    className="w-full px-4 py-2 rounded border border-ink-900/20 bg-white focus:outline-none focus:border-accent-gold"
                  >
                    {OPTIMIZATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Run Settings */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900/70 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Run Settings
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-ink-900">
                    Maximum Steps
                  </label>
                  <span className="text-accent-gold font-bold">{maxSteps}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={maxSteps}
                  onChange={(e) => setMaxSteps(parseInt(e.target.value))}
                  className="w-full accent-accent-gold"
                />
                <div className="flex justify-between text-xs text-ink-900/50 mt-1">
                  <span>1 step</span>
                  <span>10 steps</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-ink-900">
                    Checkpoint Interval
                  </label>
                  <span className="text-accent-gold font-bold">
                    Every {checkpointInterval} steps
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={checkpointInterval}
                  onChange={(e) =>
                    setCheckpointInterval(parseInt(e.target.value))
                  }
                  className="w-full accent-accent-gold"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-ink-900">
                    Auto-Correction
                  </label>
                  <p className="text-xs text-ink-900/60">
                    Automatically apply corrections when off-track
                  </p>
                </div>
                <button
                  onClick={() => setAutoCorrect(!autoCorrect)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    autoCorrect ? "bg-accent-gold" : "bg-ink-900/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      autoCorrect ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Starting Divergence */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-900/70 mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Starting Point (Optional)
            </h3>
            <textarea
              value={startingDivergence}
              onChange={(e) => setStartingDivergence(e.target.value)}
              placeholder="e.g., In 1914, Gavrilo Princip's assassination attempt fails..."
              rows={2}
              className="w-full px-4 py-2 rounded border border-ink-900/20 bg-white focus:outline-none focus:border-accent-gold resize-none text-sm"
            />
            <p className="text-xs text-ink-900/50 mt-1">
              Leave empty to let the AI choose the optimal starting point
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-parchment-100 border-t border-ink-900/10 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded font-bold text-ink-900 hover:bg-ink-900/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!customGoal.description || !customGoal.success_criteria}
            className="px-6 py-2 rounded font-bold bg-accent-gold text-ink-900 hover:bg-accent-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Launch Mission
          </button>
        </div>
      </div>
    </div>
  );
}
