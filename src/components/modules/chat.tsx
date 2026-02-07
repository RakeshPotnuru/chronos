import { AdvisorOpinion, ChatMessage } from "@/types";
import { Clock, Feather, Send } from "lucide-react";
import React, { useEffect, useRef } from "react";
import Markdown from "react-markdown";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  suggestedActions: string[];
  cabinetDebate: AdvisorOpinion[];
  selectedIntervention: string | null;
  decisionRationale: string | null;
  streamPhase: string | null;
  streamThoughts: string[];
  thoughtSignatures: string[];
  streamNarrative: string;
  showThoughtProcess: boolean;
  postThoughts: string[];
  postThoughtSignatures: string[];
  onToggleThoughtProcess: () => void;
  onVisibleMessageIdChange?: (id: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  suggestedActions,
  cabinetDebate,
  selectedIntervention,
  decisionRationale,
  streamPhase,
  streamThoughts,
  thoughtSignatures,
  streamNarrative,
  showThoughtProcess,
  postThoughts,
  postThoughtSignatures,
  onToggleThoughtProcess,
  onVisibleMessageIdChange,
}) => {
  const [inputText, setInputText] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibilityMap = useRef<Map<string, number>>(new Map());

  const advisorLabel: Record<AdvisorOpinion["advisor"], string> = {
    economist: "Economist",
    military: "Military",
    diplomat: "Diplomat",
    public_sentiment: "Public Sentiment",
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, suggestedActions, cabinetDebate, selectedIntervention]);

  useEffect(() => {
    if (!onVisibleMessageIdChange) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("data-message-id");
        if (id) {
          visibilityMap.current.set(id, entry.intersectionRatio);
        }
      });

      let maxRatio = 0;
      let bestId = null;
      for (const [id, ratio] of visibilityMap.current.entries()) {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          bestId = id;
        }
      }

      if (bestId && maxRatio > 0.1) {
        // Threshold
        onVisibleMessageIdChange(bestId);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      threshold: [0, 0.25, 0.5, 0.75, 1.0],
    });

    // Observe all message elements
    const messageElements =
      containerRef.current?.querySelectorAll("[data-message-id]");
    messageElements?.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [messages, onVisibleMessageIdChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText("");
    }
  };

  return (
    <div className="flex flex-col h-[90dvh]">
      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-4 space-y-6 px-4"
      >
        {messages.length === 0 && (
          <div className="text-center mt-20 opacity-60">
            <Feather className="w-16 h-16 mx-auto mb-4 text-ink-600" />
            <p className="font-serif text-xl text-ink-800">
              Where shall the thread of history break?
            </p>
            <p className="text-ink-600 text-sm mt-2">
              Example: &quot;The Titanic spots the iceberg early.&quot;
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            data-message-id={msg.id}
            className={`flex flex-col max-w-[90%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`relative px-6 py-4 rounded-sm shadow-md border ${
                msg.role === "user"
                  ? "bg-parchment-300 border-parchment-800/30 text-ink-900 rounded-br-none"
                  : "bg-parchment-100 border-parchment-800/30 text-ink-900 rounded-bl-none"
              }`}
            >
              <p className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>

              {/* Decorative corner accents */}
              <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-ink-900/10"></div>
              <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-ink-900/10"></div>
              <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-ink-900/10"></div>
              <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-ink-900/10"></div>
            </div>
            <span className="text-xs text-parchment-200 mt-1 font-sans font-bold uppercase tracking-wider opacity-70">
              {msg.role === "user"
                ? "Divergence Point"
                : "Historian Simulation"}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start mr-auto max-w-[92%]">
            <div className="bg-parchment-100/95 border border-ink-800/20 rounded-sm p-4 shadow-md w-full space-y-4 animate-fade-in">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full border border-ink-800/20 bg-parchment-200/70 flex items-center justify-center thinking-glow">
                    <Clock className="w-4 h-4 text-ink-700 animate-spin" />
                  </div>
                  <div>
                    <p className="font-display text-xs uppercase tracking-[0.2em] text-ink-800/80">
                      Chronicle Engine
                    </p>
                    <p className="font-serif text-sm text-ink-700 italic">
                      {streamPhase ||
                        "Analyzing divergences and council feedback..."}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-sans uppercase tracking-wide text-ink-700/70">
                  Live Deliberation
                </span>
              </div>

              <div className="h-2 rounded-full bg-parchment-300/70 overflow-hidden border border-ink-900/10">
                <div className="h-full w-2/3 thinking-shimmer" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["Economist", "Military", "Diplomat", "Public Sentiment"].map(
                  (label, idx) => (
                    <div
                      key={label}
                      className={`rounded-sm border border-ink-900/10 bg-white/60 p-3 ${
                        idx % 2 === 0
                          ? "animate-[drift_3.5s_ease-in-out_infinite]"
                          : "animate-[drift_4.2s_ease-in-out_infinite]"
                      }`}
                    >
                      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-700/80">
                        {label}
                      </p>
                      <div className="mt-2 space-y-2">
                        <div className="h-2 rounded-full thinking-shimmer" />
                        <div className="h-2 w-5/6 rounded-full thinking-shimmer" />
                        <div className="h-2 w-2/3 rounded-full thinking-shimmer" />
                      </div>
                    </div>
                  ),
                )}
              </div>

              {streamThoughts.length > 0 && (
                <div className="rounded-sm border border-ink-900/10 bg-white/70 p-3 space-y-2">
                  <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-700/80">
                    Thinking Summary
                  </p>
                  <div className="space-y-2 max-h-28 overflow-auto custom-scrollbar pr-1">
                    {streamThoughts.map((thought, idx) => (
                      <p
                        key={`${thought.slice(0, 16)}-${idx}`}
                        className="font-serif text-xs text-ink-800/90 leading-relaxed"
                      >
                        {thought}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* {thoughtSignatures.length > 0 && (
                <div className="rounded-sm border border-accent-gold/30 bg-accent-gold/10 p-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-700/80 mb-2">
                    Thought Signatures
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {thoughtSignatures.map((signature) => (
                      <code
                        key={signature}
                        className="text-[10px] px-2 py-1 rounded bg-ink-900/90 text-parchment-100 max-w-[160px] truncate"
                        title={signature}
                      >
                        {signature}
                      </code>
                    ))}
                  </div>
                </div>
              )} */}

              {streamNarrative.trim().length > 0 && (
                <div className="rounded-sm border border-ink-900/10 bg-parchment-200/80 p-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-700/80 mb-2">
                    Streaming Response
                  </p>
                  <p className="font-serif text-sm text-ink-900 whitespace-pre-wrap">
                    {streamNarrative}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-ink-700/80 font-sans uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-accent-gold animate-pulse" />
                Cross-checking historical counterfactuals
              </div>
            </div>
          </div>
        )}

        {!isLoading && cabinetDebate.length > 0 && (
          <div className="bg-parchment-100/95 border border-ink-800/20 rounded-sm p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm tracking-widest uppercase text-ink-900">
                Cabinet of Advisors
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans uppercase text-ink-700/70 tracking-wide">
                  Deliberation
                </span>
                {(postThoughts.length > 0 ||
                  postThoughtSignatures.length > 0) && (
                  <button
                    type="button"
                    onClick={onToggleThoughtProcess}
                    className="text-[10px] px-2 py-1 rounded border border-ink-900/15 bg-white/70 hover:bg-white font-sans uppercase tracking-wide text-ink-800"
                  >
                    {showThoughtProcess ? "Hide Thoughts" : "Show Thoughts"}
                  </button>
                )}
              </div>
            </div>

            {showThoughtProcess &&
              (postThoughts.length > 0 || postThoughtSignatures.length > 0) && (
                <div className="space-y-2 pt-1">
                  {postThoughts.length > 0 && (
                    <div className="rounded-sm border border-ink-900/10 bg-white/70 p-3 space-y-2">
                      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-700/80">
                        Thought Summary
                      </p>
                      <div className="space-y-2 max-h-28 overflow-auto custom-scrollbar pr-1">
                        {postThoughts.map((thought, idx) => (
                          <Markdown
                            key={`${thought.slice(0, 16)}-post-${idx}`}
                            // className="font-serif text-xs text-ink-800/90 leading-relaxed"
                          >
                            {thought}
                          </Markdown>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* {postThoughtSignatures.length > 0 && (
                    <div className="rounded-sm border border-accent-gold/30 bg-accent-gold/10 p-3">
                      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ink-700/80 mb-2">
                        Thought Signatures
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {postThoughtSignatures.map((signature) => (
                          <code
                            key={`post-${signature}`}
                            className="text-[10px] px-2 py-1 rounded bg-ink-900/90 text-parchment-100 max-w-[160px] truncate"
                            title={signature}
                          >
                            {signature}
                          </code>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              )}

            <div className="space-y-2">
              {cabinetDebate.map((entry, idx) => {
                const isSelected =
                  entry.intervention.trim().toLowerCase() ===
                  (selectedIntervention ?? "").trim().toLowerCase();

                return (
                  <article
                    key={`${entry.advisor}-${idx}`}
                    className={`p-3 rounded-sm border ${
                      isSelected
                        ? "bg-accent-gold/10 border-accent-gold/40"
                        : "bg-white/60 border-ink-900/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-sans text-xs uppercase tracking-wide text-ink-800/80 font-bold">
                        {advisorLabel[entry.advisor]}
                      </p>
                      <p className="font-sans text-xs text-ink-700/70">
                        Confidence: {entry.confidence}%
                      </p>
                    </div>
                    <p className="font-serif text-ink-900 mt-1">
                      {entry.intervention}
                    </p>
                    <p className="font-serif text-sm text-ink-700 mt-1">
                      {entry.reasoning}
                    </p>
                    <p className="font-serif text-xs text-ink-700/80 mt-2 italic">
                      Risk: {entry.risk_assessment}
                    </p>
                  </article>
                );
              })}
            </div>

            {selectedIntervention && (
              <div className="bg-ink-900/90 text-parchment-100 p-3 rounded-sm border border-ink-950 shadow-sm">
                <p className="font-sans text-xs tracking-wide uppercase text-accent-gold">
                  Chosen Intervention
                </p>
                <p className="font-serif mt-1">{selectedIntervention}</p>
                {decisionRationale && (
                  <p className="font-serif text-sm text-parchment-200/90 mt-2">
                    {decisionRationale}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Suggested Actions (Only show if not loading and it's the latest turn) */}
        {!isLoading && suggestedActions.length > 0 && (
          <div className="flex flex-col gap-2 mt-4 justify-center animate-fade-in">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(action)}
                className="px-4 py-2 bg-white hover:bg-white/80 border border-ink-800/20 
                            rounded-full text-ink-900 font-serif transition-all
                            hover:scale-95 active:scale-90 shadow-sm hover:shadow-md text-left"
              >
                Choice {idx + 1}: {action}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-auto pb-4">
        <form
          onSubmit={handleSubmit}
          className="relative max-w-4xl mx-auto flex gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter a historical divergence..."
              disabled={isLoading}
              className="w-full pl-4 pr-12 py-3 bg-parchment-100 border border-ink-800/30 
                           rounded-sm shadow-inner text-ink-900 font-serif placeholder:text-ink-600/50 
                           focus:outline-none focus:ring-1 focus:ring-accent-gold focus:border-accent-gold"
            />
            <Feather className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 w-5 h-5 opacity-50" />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-6 py-2 bg-ink-800 hover:bg-ink-900 disabled:cursor-not-allowed
                       text-parchment-100 font-display font-bold tracking-widest uppercase rounded-sm shadow-lg
                       transition-all active:translate-y-0.5 flex items-center gap-2"
          >
            <span>Forge</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
