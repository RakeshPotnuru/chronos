from pydantic import BaseModel, Field
from typing import List, Optional

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

class SimulationResponse(BaseModel):
    narrative: str
    world_state_update: WorldState
    suggested_actions: List[str]

class ImageRequest(BaseModel):
    scenario_description: str

class ImageResponse(BaseModel):
    image: str | None = None

class AudioRequest(BaseModel):
    narrative: str

class AudioResponse(BaseModel):
    audio: str | None = None