"use client";

import React, { useEffect, useRef, useState } from "react";

import { axios } from "@/lib/axios-client";
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
import { playAudio, playTickSound, stopAudio } from "@/utils/audio";
import { BookOpen } from "lucide-react";
import ChatInterface from "./chat";
import Deviations from "./deviations";
import Header from "./header";
import History from "./history";
import Ruler from "./ruler";
import Stats from "./stats";

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
    showNotification("Archive entry deleted");
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

  const handleSendMessage = async (text: string) => {
    // const newUserMsg: ChatMessage = {
    //   id: Date.now().toString(),
    //   role: "user",
    //   content: text,
    //   timestamp: new Date(),
    // };

    // setMessages((prev) => [...prev, newUserMsg]);
    // setIsLoading(true);
    // setSuggestedActions([]);
    // setError(null);
    // stopAudio(audioSourceRef);

    try {
      // const turn = (
      //   await axios.post<SimulationResponse>("/simulate-turn", {
      //     input: text,
      //     history: [...messages, newUserMsg],
      //     current_state: worldState,
      //   })
      // ).data;
      // const newAiMsg: ChatMessage = {
      //   id: (Date.now() + 1).toString(),
      //   role: "ai",
      //   content: turn.narrative,
      //   timestamp: new Date(),
      // };

      // if (!worldState || turn.world_state_update.year !== worldState.year) {
      setRulerAnimating(true);
      playTickSound({
        audioContextRef,
        audioEnabled,
      });
      setTimeout(() => setRulerAnimating(false), 2000);
      // }

      // setMessages((prev) => [...prev, newAiMsg]);
      // setWorldState(turn.world_state_update);
      // setSuggestedActions(turn.suggested_actions);
      // setHistoryPoints((prev) => [
      //   ...prev,
      //   {
      //     year: turn.world_state_update.year,
      //     chaos: turn.world_state_update.chaos_level,
      //   },
      // ]);

      // setIsGeneratingAudio(true);
      // axios
      //   .post<AudioResponse>("/generate-audio", {
      //     narrative: turn.narrative,
      //   })
      //   .then(({ data }) => {
      //     if (data.audio)
      //       playAudio({
      //         audioContextRef,
      //         audioEnabled,
      //         base64Data: data.audio,
      //         audioSourceRef,
      //       });
      //   })
      //   .catch((e) => console.error(e))
      //   .finally(() => setIsGeneratingAudio(false));

      // setIsGeneratingImage(true);
      // axios
      //   .post<ImageResponse>("/generate-image", {
      //     scenario_description: turn.narrative,
      //   })
      //   .then(({ data }) => {
      //     if (data.image) {
      //       setBackgroundImage(data.image);
      //       showNotification("World scenario updated");
      //     }
      //   })
      //   .catch((e) => console.error(e))
      //   .finally(() => setIsGeneratingImage(false));
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
        <Ruler rulerAnimating={rulerAnimating} />

        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          worldState={worldState}
          isGeneratingImage={isGeneratingImage}
          isGeneratingAudio={isGeneratingAudio}
          audioEnabled={audioEnabled}
          audioSourceRef={audioSourceRef}
          setAudioEnabled={setAudioEnabled}
        />

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
