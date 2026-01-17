export interface WorldState {
  year: number;
  chaos_level: number; // 0-100
  deviations: string[];
  population_mood: string;
  geopolitical_stability: number; // 0-100
}

export interface SimulationTurn {
  narrative: string;
  world_state_update: WorldState;
  suggested_actions: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
}

export interface HistoryPoint {
  year: number;
  chaos: number;
}

export interface SessionMetadata {
  id: string;
  title: string;
  lastUpdated: number;
  year: number;
}

export interface SimulationSession {
  metadata: SessionMetadata;
  messages: ChatMessage[];
  world_state: WorldState | null;
  history_points: HistoryPoint[];
  suggested_actions: string[];
  background_image: string | null;
}

export interface SimulationResponse {
  narrative: string;
  world_state_update: WorldState;
  suggested_actions: string[];
}

export interface ImageResponse {
  image: string | null;
}

export interface AudioResponse {
  audio: string | null;
}
