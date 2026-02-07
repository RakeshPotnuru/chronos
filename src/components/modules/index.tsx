"use client";

import React, { useEffect, useRef, useState } from "react";

import { axios } from "@/lib/axios-client";
import {
  AdvisorOpinion,
  AudioResponse,
  ChatMessage,
  HistoryPoint,
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
  const [cabinetDebate, setCabinetDebate] = useState<AdvisorOpinion[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<
    string | null
  >(null);
  const [decisionRationale, setDecisionRationale] = useState<string | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rulerAnimating, setRulerAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [streamPhase, setStreamPhase] = useState<string | null>(null);
  const [streamThoughts, setStreamThoughts] = useState<string[]>([]);
  const [thoughtSignatures, setThoughtSignatures] = useState<string[]>([]);
  const [streamNarrative, setStreamNarrative] = useState("");
  const [lastThoughts, setLastThoughts] = useState<string[]>([]);
  const [lastThoughtSignatures, setLastThoughtSignatures] = useState<string[]>(
    [],
  );
  const [showThoughtProcess, setShowThoughtProcess] = useState(false);

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
    setCabinetDebate([]);
    setSelectedIntervention(null);
    setDecisionRationale(null);

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
        data.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
      );
      setWorldState(data.world_state);
      setHistoryPoints(data.history_points);
      setSuggestedActions(data.suggested_actions);
      setBackgroundImage(data.background_image);
      setCabinetDebate(data.cabinet_debate ?? []);
      setSelectedIntervention(data.selected_intervention ?? null);
      setDecisionRationale(data.decision_rationale ?? null);
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
      cabinet_debate: cabinetDebate,
      selected_intervention: selectedIntervention,
      decision_rationale: decisionRationale,
    };

    localStorage.setItem(
      STORAGE_KEY_PREFIX + currentSessionId,
      JSON.stringify(sessionData),
    );

    // Update metadata list
    const updatedSessions = sessions.map((s) =>
      s.id === currentSessionId ? sessionData.metadata : s,
    );
    // Move current to top if it changed
    const sortedSessions = [...updatedSessions].sort(
      (a, b) => b.lastUpdated - a.lastUpdated,
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
    cabinetDebate,
    selectedIntervention,
    decisionRationale,
    currentSessionId,
  ]);

  // --- HELPERS ---
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const extractNarrativePreview = (jsonBuffer: string): string => {
    const marker = '"narrative"';
    const markerIdx = jsonBuffer.indexOf(marker);
    if (markerIdx === -1) return "";

    const colonIdx = jsonBuffer.indexOf(":", markerIdx + marker.length);
    if (colonIdx === -1) return "";

    const startQuoteIdx = jsonBuffer.indexOf('"', colonIdx);
    if (startQuoteIdx === -1) return "";

    let cursor = startQuoteIdx + 1;
    let escape = false;
    let value = "";

    while (cursor < jsonBuffer.length) {
      const ch = jsonBuffer[cursor];
      if (escape) {
        if (ch === "n") value += "\n";
        else if (ch === "t") value += "\t";
        else if (ch === "r") value += "\r";
        else value += ch;
        escape = false;
        cursor += 1;
        continue;
      }

      if (ch === "\\") {
        escape = true;
        cursor += 1;
        continue;
      }

      if (ch === '"') {
        return value;
      }

      value += ch;
      cursor += 1;
    }

    return value;
  };

  const runSimulationStream = async (
    text: string,
    history: ChatMessage[],
    currentState: WorldState | null,
  ): Promise<{
    turn: SimulationResponse;
    thoughts: string[];
    signatures: string[];
    narrativePreview: string;
  }> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/simulate-turn-stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          history,
          current_state: currentState,
        }),
      },
    );

    if (!response.ok || !response.body) {
      throw new Error("Streaming endpoint unavailable");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalTurn: SimulationResponse | null = null;
    let thoughtBuffer: string[] = [];
    let signatureBuffer: string[] = [];
    let answerJsonBuffer = "";
    let latestNarrativePreview = "";

    const parseSseEvent = (rawEvent: string) => {
      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""));

      if (dataLines.length === 0) return null;

      try {
        return JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
      } catch {
        return null;
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");

      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
        const event = parseSseEvent(rawEvent);
        if (!event || typeof event.type !== "string") continue;

        if (event.type === "stage" && typeof event.message === "string") {
          setStreamPhase(event.message);
        }

        if (event.type === "advisor_ready") {
          const advisor =
            typeof event.advisor === "string"
              ? event.advisor.replaceAll("_", " ")
              : "advisor";
          setStreamPhase(`Advisor ready: ${advisor}`);
        }

        if (event.type === "signature" && typeof event.signature === "string") {
          if (!signatureBuffer.includes(event.signature)) {
            signatureBuffer = [...signatureBuffer, event.signature].slice(-4);
          }
          setThoughtSignatures((prev) => {
            if (prev.includes(event.signature as string)) return prev;
            return [...prev, event.signature as string].slice(-4);
          });
        }

        if (event.type === "thought_delta" && typeof event.text === "string") {
          const chunk = event.text;
          if (chunk.trim().length > 0) {
            if (thoughtBuffer.length === 0) {
              thoughtBuffer = [chunk];
            } else {
              const next = [...thoughtBuffer];
              const last = next[next.length - 1];
              if (last.length > 220 || chunk.includes("\n")) {
                next.push(chunk);
              } else {
                next[next.length - 1] = `${last}${chunk}`;
              }
              thoughtBuffer = next.slice(-5);
            }
            setStreamThoughts((prev) => {
              if (prev.length === 0) return [chunk];
              const next = [...prev];
              const last = next[next.length - 1];
              if (last.length > 220 || chunk.includes("\n")) {
                next.push(chunk);
              } else {
                next[next.length - 1] = `${last}${chunk}`;
              }
              return next.slice(-5);
            });
          }
        }

        if (event.type === "answer_delta" && typeof event.text === "string") {
          answerJsonBuffer += event.text;
          latestNarrativePreview = extractNarrativePreview(answerJsonBuffer);
          if (latestNarrativePreview.trim().length > 0) {
            setStreamNarrative(latestNarrativePreview);
          }
        }

        if (event.type === "done" && event.payload) {
          finalTurn = event.payload as SimulationResponse;
        }

        if (event.type === "error") {
          throw new Error(
            typeof event.message === "string"
              ? event.message
              : "Streaming simulation failed",
          );
        }
      }
    }

    if (!finalTurn) {
      throw new Error("No final simulation payload received");
    }

    return {
      turn: finalTurn,
      thoughts: thoughtBuffer,
      signatures: signatureBuffer,
      narrativePreview: latestNarrativePreview,
    };
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
    setCabinetDebate([]);
    setSelectedIntervention(null);
    setDecisionRationale(null);
    setStreamPhase("Assembling cabinet advisors");
    setThoughtSignatures([]);
    setStreamThoughts([]);
    setStreamNarrative("");
    setLastThoughts([]);
    setLastThoughtSignatures([]);
    setShowThoughtProcess(false);
    setError(null);
    stopAudio(audioSourceRef);

    try {
      const history = [...messages, newUserMsg];
      let turn: SimulationResponse;
      let capturedThoughts: string[] = [];
      let capturedSignatures: string[] = [];
      let capturedNarrative = "";

      try {
        const streamed = await runSimulationStream(text, history, worldState);
        turn = streamed.turn;
        capturedThoughts = streamed.thoughts;
        capturedSignatures = streamed.signatures;
        capturedNarrative = streamed.narrativePreview;
      } catch (streamErr) {
        console.warn("Streaming failed, using fallback endpoint", streamErr);
        turn = (
          await axios.post<SimulationResponse>("/simulate-turn", {
            input: text,
            history,
            current_state: worldState,
          })
        ).data;
      }

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: turn.narrative || capturedNarrative || streamNarrative,
        timestamp: new Date(),
      };

      if (!worldState || turn.world_state_update.year !== worldState.year) {
        setRulerAnimating(true);
        playTickSound({
          audioContextRef,
          audioEnabled,
        });
        setTimeout(() => setRulerAnimating(false), 2000);
      }

      setMessages((prev) => [...prev, newAiMsg]);
      setWorldState(turn.world_state_update);
      setSuggestedActions(turn.suggested_actions);
      setCabinetDebate(turn.cabinet_debate);
      setSelectedIntervention(turn.selected_intervention);
      setDecisionRationale(turn.decision_rationale);
      setLastThoughts(capturedThoughts);
      setLastThoughtSignatures(capturedSignatures);
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
          if (data.audio)
            playAudio({
              audioContextRef,
              audioEnabled,
              base64Data: data.audio,
              audioSourceRef,
            });
        })
        .catch((e) => console.error(e))
        .finally(() => setIsGeneratingAudio(false));

      // TODO: Re-enable image generation
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
      setStreamPhase(null);
      setStreamNarrative("");
      setStreamThoughts([]);
      setThoughtSignatures([]);
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
            className={`w-[55%] md:pl-10 flex-1 flex flex-col min-w-0 transition-colors duration-1000`}
          >
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              suggestedActions={suggestedActions}
              cabinetDebate={cabinetDebate}
              selectedIntervention={selectedIntervention}
              decisionRationale={decisionRationale}
              streamPhase={streamPhase}
              streamThoughts={streamThoughts}
              thoughtSignatures={thoughtSignatures}
              streamNarrative={streamNarrative}
              showThoughtProcess={showThoughtProcess}
              postThoughts={lastThoughts}
              postThoughtSignatures={lastThoughtSignatures}
              onToggleThoughtProcess={() =>
                setShowThoughtProcess((prev) => !prev)
              }
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
