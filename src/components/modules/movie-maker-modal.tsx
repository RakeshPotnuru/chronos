import { axios } from "@/lib/axios-client";
import {
  ChatMessage,
  VideoDuration,
  VideoMotion,
  VideoPromptConfig,
  VideoPromptResponse,
  VideoStyle,
} from "@/types";
import { Copy, Film, Loader2, Settings, X } from "lucide-react";
import React, { useState } from "react";

interface MovieMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
}

const MovieMakerModal: React.FC<MovieMakerModalProps> = ({
  isOpen,
  onClose,
  messages,
}) => {
  const [config, setConfig] = useState<VideoPromptConfig>({
    style: "cinematic",
    duration: "medium",
    motion: "slow",
    include_text_overlay: false,
    include_voiceover: true,
    focus_on_emotion: false,
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowConfig(false);

    try {
      // Convert messages to simplified format
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data } = await axios.post<VideoPromptResponse>(
        "/generate-video-prompt",
        {
          conversation_history: conversationHistory,
          config,
        },
      );

      if (data.video_prompt) {
        setGeneratedPrompt(data.video_prompt);
      } else {
        setGeneratedPrompt(
          "Failed to generate video prompt. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error generating video prompt:", error);
      setGeneratedPrompt(
        "An error occurred while generating the video prompt.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedPrompt) {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setGeneratedPrompt(null);
    setShowConfig(true);
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 bg-ink-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-parchment-100 border-2 border-ink-900/30 rounded-sm shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-ink-900 text-parchment-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-gold/20 rounded">
              <Film className="w-6 h-6 text-accent-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wider uppercase">
                Movie Maker
              </h2>
              <p className="text-xs text-parchment-200 font-sans mt-0.5">
                Generate cinematic video prompts from your simulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-parchment-100/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showConfig && !generatedPrompt && (
            <>
              {/* Configuration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-ink-900">
                  <Settings className="w-4 h-4" />
                  <h3 className="font-sans text-sm uppercase tracking-wider font-bold">
                    Configure Your Video
                  </h3>
                </div>

                {/* Style Selection */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-ink-700 mb-2">
                    Visual Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(
                      [
                        "cinematic",
                        "documentary",
                        "vintage",
                        "dramatic",
                        "historical",
                      ] as VideoStyle[]
                    ).map((style) => (
                      <button
                        key={style}
                        onClick={() => setConfig({ ...config, style })}
                        className={`px-4 py-3 rounded-sm border-2 font-serif transition-all capitalize ${
                          config.style === style
                            ? "bg-accent-gold/20 border-accent-gold text-ink-900 shadow-md"
                            : "bg-white border-ink-900/10 text-ink-700 hover:border-ink-900/30"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-ink-700 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["short", "medium", "long"] as VideoDuration[]).map(
                      (duration) => (
                        <button
                          key={duration}
                          onClick={() => setConfig({ ...config, duration })}
                          className={`px-4 py-3 rounded-sm border-2 font-serif transition-all capitalize ${
                            config.duration === duration
                              ? "bg-accent-gold/20 border-accent-gold text-ink-900 shadow-md"
                              : "bg-white border-ink-900/10 text-ink-700 hover:border-ink-900/30"
                          }`}
                        >
                          {duration}
                          <span className="block text-xs text-ink-600 mt-0.5">
                            {duration === "short"
                              ? "5-8s"
                              : duration === "medium"
                                ? "10-15s"
                                : "20-30s"}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Motion Selection */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-wider text-ink-700 mb-2">
                    Camera Motion
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["static", "slow", "dynamic"] as VideoMotion[]).map(
                      (motion) => (
                        <button
                          key={motion}
                          onClick={() => setConfig({ ...config, motion })}
                          className={`px-4 py-3 rounded-sm border-2 font-serif transition-all capitalize ${
                            config.motion === motion
                              ? "bg-accent-gold/20 border-accent-gold text-ink-900 shadow-md"
                              : "bg-white border-ink-900/10 text-ink-700 hover:border-ink-900/30"
                          }`}
                        >
                          {motion}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-3 p-3 bg-white border border-ink-900/10 rounded-sm cursor-pointer hover:bg-parchment-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.include_text_overlay}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          include_text_overlay: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-accent-gold"
                    />
                    <div className="flex-1">
                      <span className="font-sans text-sm text-ink-900">
                        Include Text Overlay
                      </span>
                      <p className="text-xs text-ink-600 mt-0.5">
                        Add year and location captions
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white border border-ink-900/10 rounded-sm cursor-pointer hover:bg-parchment-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.include_voiceover}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          include_voiceover: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-accent-gold"
                    />
                    <div className="flex-1">
                      <span className="font-sans text-sm text-ink-900">
                        Voiceover Pacing
                      </span>
                      <p className="text-xs text-ink-600 mt-0.5">
                        Optimize timing for narration
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white border border-ink-900/10 rounded-sm cursor-pointer hover:bg-parchment-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.focus_on_emotion}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          focus_on_emotion: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-accent-gold"
                    />
                    <div className="flex-1">
                      <span className="font-sans text-sm text-ink-900">
                        Emotional Focus
                      </span>
                      <p className="text-xs text-ink-600 mt-0.5">
                        Emphasize character reactions and expressions
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-accent-gold/10 border border-accent-gold/30 rounded-sm p-4">
                <p className="text-xs font-sans text-ink-800 leading-relaxed">
                  <strong className="text-ink-900">About Movie Maker:</strong>{" "}
                  This feature generates production-ready video prompts
                  optimized for Google&apos;s Veo 3.1 video generation model.
                  The prompts follow cinematic best practices with detailed
                  camera angles, lighting, and scene composition.
                </p>
              </div>
            </>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-accent-gold animate-spin" />
              <p className="font-sans text-sm text-ink-700">
                Crafting your cinematic prompt...
              </p>
              <p className="text-xs text-ink-600 max-w-md text-center">
                Analyzing narrative structure, emotional beats, and visual
                storytelling opportunities
              </p>
            </div>
          )}

          {/* Generated Prompt */}
          {generatedPrompt && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-sm uppercase tracking-wider font-bold text-ink-900">
                  Your Video Prompt
                </h3>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm border transition-all ${
                    copied
                      ? "bg-green-100 border-green-400 text-green-800"
                      : "bg-white border-ink-900/20 text-ink-900 hover:bg-parchment-50"
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-xs font-sans uppercase tracking-wider">
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>
              </div>

              <div className="bg-white border-2 border-ink-900/20 rounded-sm p-6 max-h-96 overflow-y-auto">
                <p className="font-serif text-ink-900 leading-relaxed whitespace-pre-wrap">
                  {generatedPrompt}
                </p>
              </div>

              {/* Config Summary */}
              <div className="bg-parchment-50 border border-ink-900/10 rounded-sm p-4">
                <p className="text-xs font-sans uppercase tracking-wider text-ink-700 mb-2">
                  Configuration Used
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white border border-ink-900/10 rounded text-xs font-sans text-ink-800">
                    Style: {config.style}
                  </span>
                  <span className="px-2 py-1 bg-white border border-ink-900/10 rounded text-xs font-sans text-ink-800">
                    Duration: {config.duration}
                  </span>
                  <span className="px-2 py-1 bg-white border border-ink-900/10 rounded text-xs font-sans text-ink-800">
                    Motion: {config.motion}
                  </span>
                  {config.include_text_overlay && (
                    <span className="px-2 py-1 bg-accent-gold/20 border border-accent-gold/30 rounded text-xs font-sans text-ink-900">
                      Text Overlay
                    </span>
                  )}
                  {config.include_voiceover && (
                    <span className="px-2 py-1 bg-accent-gold/20 border border-accent-gold/30 rounded text-xs font-sans text-ink-900">
                      Voiceover
                    </span>
                  )}
                  {config.focus_on_emotion && (
                    <span className="px-2 py-1 bg-accent-gold/20 border border-accent-gold/30 rounded text-xs font-sans text-ink-900">
                      Emotional Focus
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-parchment-50 border-t border-ink-900/10 p-4 flex items-center justify-end gap-3">
          {generatedPrompt ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-ink-900/20 bg-white hover:bg-parchment-50 text-ink-900 font-sans text-sm uppercase tracking-wider rounded-sm transition-colors"
              >
                Generate Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-ink-900 hover:bg-ink-800 text-parchment-100 font-sans font-bold text-sm uppercase tracking-wider rounded-sm transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-ink-900/20 bg-white hover:bg-parchment-50 text-ink-900 font-sans text-sm uppercase tracking-wider rounded-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2 bg-accent-gold hover:bg-accent-gold/90 disabled:bg-ink-900/30 disabled:cursor-not-allowed text-ink-900 font-sans font-bold text-sm uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                Generate Prompt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieMakerModal;
