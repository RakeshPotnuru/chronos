from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class WorldState(BaseModel):
    year: int
    chaos_level: int = Field(ge=0, le=100, description="Chaos level from 0 to 100")
    deviations: List[str]
    population_mood: str
    geopolitical_stability: int = Field(ge=0, le=100)

class SimulationRequest(BaseModel):
    input: str
    history: List[ChatMessage]
    current_state: Optional[WorldState] = None

class AdvisorOpinion(BaseModel):
    advisor: Literal["economist", "military", "diplomat", "public_sentiment"]
    intervention: str
    reasoning: str
    risk_assessment: str
    confidence: int = Field(ge=0, le=100)

class AdvisorRecommendation(BaseModel):
    intervention: str
    reasoning: str
    risk_assessment: str
    confidence: int = Field(ge=0, le=100)

class CabinetDecision(BaseModel):
    narrative: str
    world_state_update: WorldState
    suggested_actions: List[str]
    selected_intervention: str
    decision_rationale: str

class SimulationResponse(BaseModel):
    narrative: str
    world_state_update: WorldState
    suggested_actions: List[str]
    cabinet_debate: List[AdvisorOpinion]
    selected_intervention: str
    decision_rationale: str

class ImageRequest(BaseModel):
    scenario_description: str

class ImageResponse(BaseModel):
    image: str | None = None

class AudioRequest(BaseModel):
    narrative: str

class AudioResponse(BaseModel):
    audio: str | None = None
