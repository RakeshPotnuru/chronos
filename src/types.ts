export interface WorldState {
  year: number;
  chaos_level: number; // 0-100
  deviations: string[];
  population_mood: string;
  geopolitical_stability: number; // 0-100
}

export type AdvisorRole =
  | "economist"
  | "military"
  | "diplomat"
  | "public_sentiment";

export interface AdvisorOpinion {
  advisor: AdvisorRole;
  intervention: string;
  reasoning: string;
  risk_assessment: string;
  confidence: number; // 0-100
}

export interface SimulationTurn {
  narrative: string;
  world_state_update: WorldState;
  suggested_actions: string[];
  cabinet_debate: AdvisorOpinion[];
  selected_intervention: string;
  decision_rationale: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  backgroundImage?: string;
  audio?: string;
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
  cabinet_debate?: AdvisorOpinion[];
  selected_intervention?: string | null;
  decision_rationale?: string | null;
}

export interface SimulationResponse {
  narrative: string;
  world_state_update: WorldState;
  suggested_actions: string[];
  cabinet_debate: AdvisorOpinion[];
  selected_intervention: string;
  decision_rationale: string;
}

export interface ImageResponse {
  image: string | null;
}

export interface AudioResponse {
  audio: string | null;
}

export interface FactCheckSegment {
  text: string;
  classification: "verified" | "divergent" | "plausible";
  real_history_context?: string; // For divergent items
}

export interface FactCheckResponse {
  segments: FactCheckSegment[];
}

// Marathon Simulation Types
export interface MarathonGoal {
  description: string;
  success_criteria: string;
  target_year?: number;
  optimization_metric?: "stability" | "chaos" | "peace";
}

export interface MarathonConfig {
  goal: MarathonGoal;
  max_steps: number;
  checkpoint_interval: number;
  auto_correct: boolean;
  starting_divergence?: string;
}

export interface CheckpointEvaluation {
  step_number: number;
  progress_score: number;
  on_track: boolean;
  deviation_analysis: string;
  recommended_correction?: string;
}

export interface MarathonStep {
  step_number: number;
  user_input: string;
  simulation_response: SimulationResponse;
  checkpoint?: CheckpointEvaluation;
  correction_applied?: string;
  background_image?: string;
  audio_data?: string;
}

export type MarathonStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export interface MarathonSession {
  id: string;
  config: MarathonConfig;
  status: MarathonStatus;
  steps: MarathonStep[];
  current_world_state?: WorldState | null;
  final_evaluation?: string;
  error_message?: string;
}

export interface GoalPreset {
  description: string;
  success_criteria: string;
  target_year?: number;
  optimization_metric?: "stability" | "chaos" | "peace";
}

export interface GoalPresetsResponse {
  presets: Record<string, GoalPreset>;
}

export type VideoStyle =
  | "cinematic"
  | "documentary"
  | "vintage"
  | "dramatic"
  | "historical";
export type VideoDuration = "short" | "medium" | "long";
export type VideoMotion = "static" | "slow" | "dynamic";

export interface VideoPromptConfig {
  style: VideoStyle;
  duration: VideoDuration;
  motion: VideoMotion;
  include_text_overlay: boolean;
  include_voiceover: boolean;
  focus_on_emotion: boolean;
}

export interface VideoPromptRequest {
  conversation_history: { role: string; content: string }[];
  config: VideoPromptConfig;
}

export interface VideoPromptResponse {
  video_prompt: string | null;
  metadata: Record<string, any>;
}
