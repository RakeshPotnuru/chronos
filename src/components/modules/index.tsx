"use client";

import React, { useEffect, useRef, useState } from "react";

import { axios } from "@/lib/axios-client";
import { cn } from "@/lib/utils";
import {
  AudioResponse,
  ChatMessage,
  HistoryPoint,
  ImageResponse,
  SessionMetadata,
  SimulationResponse,
  SimulationSession,
  WorldState,
} from "@/types";
import { base64ToUint8Array, playPCM } from "@/utils/audio";
import {
  BookOpen,
  ChevronLeftIcon,
  HistoryIcon,
  ImageIcon,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import ChatInterface from "./chat";
import Deviations from "./deviations";
import History from "./history";
import Stats from "./stats";
import YearOdometer from "./year-odometer";

const STORAGE_KEY_PREFIX = "chronos_session_";
const METADATA_KEY = "chronos_sessions_list";

export default function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [historyPoints, setHistoryPoints] = useState<HistoryPoint[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rulerAnimating, setRulerAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedMetadata = localStorage.getItem(METADATA_KEY);
    if (savedMetadata) {
      const list = JSON.parse(savedMetadata) as SessionMetadata[];
      setSessions(list);
      if (list.length > 0) {
        loadSession(list[0].id);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // --- SESSION MANAGEMENT ---
  const createNewSession = () => {
    const id = Date.now().toString();
    const newMetadata: SessionMetadata = {
      id,
      title: "New Chronicle",
      lastUpdated: Date.now(),
      year: 0,
    };

    setCurrentSessionId(id);
    setMessages([]);
    setWorldState(null);
    setHistoryPoints([]);
    setSuggestedActions([]);
    setBackgroundImage(null);

    const newList = [newMetadata, ...sessions];
    setSessions(newList);
    localStorage.setItem(METADATA_KEY, JSON.stringify(newList));
    setSidebarOpen(false);
  };

  const loadSession = (id: string) => {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + id);
    if (raw) {
      const data = JSON.parse(raw) as SimulationSession;
      setCurrentSessionId(id);
      setMessages(
        data.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
      );
      setWorldState(data.world_state);
      setHistoryPoints(data.history_points);
      setSuggestedActions(data.suggested_actions);
      setBackgroundImage(data.background_image);
      setSidebarOpen(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newList = sessions.filter((s) => s.id !== id);
    setSessions(newList);
    localStorage.setItem(METADATA_KEY, JSON.stringify(newList));
    localStorage.removeItem(STORAGE_KEY_PREFIX + id);
    if (currentSessionId === id) {
      if (newList.length > 0) loadSession(newList[0].id);
      else createNewSession();
    }
  };

  // --- AUTO SAVE ---
  useEffect(() => {
    if (!currentSessionId) return;

    const currentTitle =
      messages.length > 0
        ? messages[0].content.slice(0, 30) +
          (messages[0].content.length > 30 ? "..." : "")
        : "Empty Chronicle";

    const sessionData: SimulationSession = {
      metadata: {
        id: currentSessionId,
        title: currentTitle,
        lastUpdated: Date.now(),
        year: worldState?.year || 0,
      },
      messages,
      world_state: worldState,
      history_points: historyPoints,
      suggested_actions: suggestedActions,
      background_image: backgroundImage,
    };

    localStorage.setItem(
      STORAGE_KEY_PREFIX + currentSessionId,
      JSON.stringify(sessionData)
    );

    // Update metadata list
    const updatedSessions = sessions.map((s) =>
      s.id === currentSessionId ? sessionData.metadata : s
    );
    // Move current to top if it changed
    const sortedSessions = [...updatedSessions].sort(
      (a, b) => b.lastUpdated - a.lastUpdated
    );

    // Only update state and storage if metadata actually changed to avoid loop
    const existing = sessions.find((s) => s.id === currentSessionId);
    if (
      !existing ||
      existing.lastUpdated !== sessionData.metadata.lastUpdated ||
      existing.title !== sessionData.metadata.title
    ) {
      setSessions(sortedSessions);
      localStorage.setItem(METADATA_KEY, JSON.stringify(sortedSessions));
    }
  }, [
    messages,
    worldState,
    historyPoints,
    suggestedActions,
    backgroundImage,
    currentSessionId,
  ]);

  // --- HELPERS ---
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === "suspended")
      audioContextRef.current.resume();
    return audioContextRef.current;
  };

  const playTickSound = () => {
    if (!audioEnabled) return;
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        // ignore
      }
      audioSourceRef.current = null;
    }
  };

  const playAudio = (base64Data: string) => {
    if (!audioEnabled) return;
    const ctx = initAudio();
    stopAudio();

    // Strip data URI scheme if present
    const base64String = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;

    const pcmData = base64ToUint8Array(base64String);
    audioSourceRef.current = playPCM(pcmData, ctx);
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);
    setSuggestedActions([]);
    setError(null);
    stopAudio();

    try {
      const turn = (
        await axios.post<SimulationResponse>("/simulate-turn", {
          input: text,
          history: [...messages, newUserMsg],
          current_state: worldState,
        })
      ).data;
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: turn.narrative,
        timestamp: new Date(),
      };

      if (!worldState || turn.world_state_update.year !== worldState.year) {
        setRulerAnimating(true);
        playTickSound();
        setTimeout(() => setRulerAnimating(false), 800);
      }

      setMessages((prev) => [...prev, newAiMsg]);
      setWorldState(turn.world_state_update);
      setSuggestedActions(turn.suggested_actions);
      setHistoryPoints((prev) => [
        ...prev,
        {
          year: turn.world_state_update.year,
          chaos: turn.world_state_update.chaos_level,
        },
      ]);

      setIsGeneratingAudio(true);
      axios
        .post<AudioResponse>("/generate-audio", {
          narrative: turn.narrative,
        })
        .then(({ data }) => {
          if (data.audio) playAudio(data.audio);
        })
        .catch((e) => console.error(e))
        .finally(() => setIsGeneratingAudio(false));

      setIsGeneratingImage(true);
      axios
        .post<ImageResponse>("/generate-image", {
          scenario_description: turn.narrative,
        })
        .then(({ data }) => {
          if (data.image) {
            setBackgroundImage(data.image);
            showNotification("World scenario updated");
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setIsGeneratingImage(false));
    } catch (err) {
      console.error(err);
      setError("Temporal sync failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* Sidebar - Historical Archives */}
      {sidebarOpen && (
        <History
          sidebarOpen={sidebarOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          createNewSession={createNewSession}
          loadSession={loadSession}
          deleteSession={deleteSession}
        />
      )}

      {/* Main Container */}
      <div
        className="flex-1 h-full flex flex-col relative bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : undefined,
        }}
      >
        {/* Top Decoration */}
        <div className="h-12 w-full relative overflow-hidden bg-linear-to-b from-ink-900 via-ink-800 to-transparent z-20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
          <div
            className={`absolute inset-0 flex transition-transform duration-2000 ease-out ${rulerAnimating ? "animate-ruler-spin" : ""}`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='48' viewBox='0 0 50 48' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='20' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='30' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='40' y='0' width='1' height='10' fill='%23c5a059' opacity='0.4'/%3E%3Crect x='0' y='0' width='2' height='22' fill='%23c5a059'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat-x",
              backgroundSize: "50px 48px",
              width: "200%",
            }}
          />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 z-30 pointer-events-none h-full flex flex-col items-center">
            <svg
              width="40"
              height="44"
              viewBox="0 0 40 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            >
              <path
                d="M20 42V4M20 42L12 30M20 42L28 30"
                stroke="#c5a059"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 28C10 28 14 32 20 32C26 32 30 28 30 28"
                stroke="#c5a059"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <path
                d="M20 12L17 18L20 24L23 18L20 12Z"
                fill="#c5a059"
                stroke="#1a1614"
                strokeWidth="0.5"
              />
              <circle
                cx="20"
                cy="4"
                r="3"
                fill="#c5a059"
                stroke="#1a1614"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
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
              "top-10": !worldState,
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
            <div className="hidden lg:flex flex-col items-end gap-1">
              {isGeneratingImage && (
                <div className="flex items-center gap-2 text-xs text-ink-900 animate-pulse">
                  <ImageIcon className="w-3 h-3" />
                  <span>Visualizing...</span>
                </div>
              )}
              {isGeneratingAudio && (
                <div className="flex items-center gap-2 text-xs text-ink-900 animate-pulse">
                  <Volume2 className="w-3 h-3" />
                  <span>Narrating...</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
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

        {/* Content */}
        <div className="flex flex-row overflow-hidden relative z-0">
          <section
            className={`w-1/5 p-6 md:pl-10 min-w-0 overflow-hidden flex flex-col transition-colors duration-1000`}
          >
            <Stats state={worldState} isLoading={isLoading} />
          </section>

          <section
            className={`w-[55%] md:pl-10 flex-1 flex flex-col min-w-0 border-r border-ink-800/10 transition-colors duration-1000`}
          >
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              suggestedActions={suggestedActions}
            />
          </section>

          <section
            className={`w-1/4 p-6 md:pl-10 min-w-0 overflow-hidden flex flex-col transition-colors duration-1000`}
          >
            <Deviations
              deviations={worldState?.deviations}
              isLoading={isLoading}
            />
          </section>
        </div>

        {error && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-accent-red text-white px-6 py-3 rounded shadow-lg z-50 font-serif border-2 border-white/20 animate-bounce">
            {error}
            <button onClick={() => setError(null)} className="ml-4 font-bold">
              ✕
            </button>
          </div>
        )}
        {notification && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-ink-800 text-accent-gold px-6 py-3 rounded shadow-lg z-50 font-serif border border-accent-gold animate-pulse flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {notification}
          </div>
        )}
      </div>
    </div>
  );
}
