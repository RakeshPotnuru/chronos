import { SessionMetadata } from "@/types";
import { Plus, Trash2 } from "lucide-react";

interface HistoryProps {
  sidebarOpen: boolean;
  sessions: SessionMetadata[];
  currentSessionId: string | null;
  createNewSession: () => void;
  loadSession: (id: string) => void;
  deleteSession: (e: React.MouseEvent, id: string) => void;
}

export default function History({
  sidebarOpen,
  sessions,
  currentSessionId,
  createNewSession,
  loadSession,
  deleteSession,
}: HistoryProps) {
  return (
    <aside
      className={`fixed md:relative z-30 h-full bg-ink-900 border-r border-accent-gold/30 transition-all duration-300 flex flex-col ${sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:w-16 md:translate-x-0"}`}
    >
      <div className="p-4 flex flex-col h-full overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 ${!sidebarOpen && "hidden md:flex items-center"}`}
        >
          <button
            onClick={createNewSession}
            className={`flex items-center gap-2 p-3 rounded-sm border border-accent-gold/20 bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold transition-all mb-4 ${!sidebarOpen && "w-10 h-10 p-2 justify-center"}`}
            title="New Chronicle"
          >
            <Plus className="shrink-0" />
            {sidebarOpen && (
              <span className="font-display text-sm tracking-widest">
                New Timeline
              </span>
            )}
          </button>

          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`group relative flex flex-col p-3 rounded-sm border cursor-pointer transition-all ${currentSessionId === s.id ? "border-accent-gold bg-accent-gold/5" : "border-parchment-800/20 hover:border-accent-gold/50 hover:bg-ink-800"}`}
            >
              {sidebarOpen ? (
                <>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-serif text-parchment-100 text-sm line-clamp-2 leading-tight flex-1">
                      {s.title}
                    </span>
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 text-parchment-800 hover:text-accent-red transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-accent-gold mt-1 uppercase tracking-tighter">
                    Anno {s.year}
                  </span>
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <div
                    className={`w-2 h-2 rounded-full ${currentSessionId === s.id ? "bg-accent-gold" : "bg-parchment-800"}`}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
