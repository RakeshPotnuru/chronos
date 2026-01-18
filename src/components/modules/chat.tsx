import { ChatMessage } from "@/types";
import { Clock, Feather, Send } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  suggestedActions: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  suggestedActions,
}) => {
  const [inputText, setInputText] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestedActions]);

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
      <div className="flex-1 overflow-y-auto py-4 space-y-6 px-4">
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
          <div className="flex items-start mr-auto max-w-[80%]">
            <div className="bg-parchment-100 px-6 py-4 rounded-sm shadow-sm border border-parchment-800/20 flex gap-2 items-center">
              <Clock className="animate-spin w-5 h-5 text-ink-600" />
              <span className="font-serif italic text-ink-600">
                Consulting the archives...
              </span>
            </div>
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
