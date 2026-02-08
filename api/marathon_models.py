from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from api.models import SimulationResponse, WorldState


# Goal presets for quick-start options
GOAL_PRESETS = {
    "prevent_wwi": {
        "description": "Prevent World War I",
        "success_criteria": "No major European war by 1920, Archduke Franz Ferdinand survives or diplomatic channels prevent escalation",
        "target_year": 1920,
        "optimization_metric": "peace",
    },
    "maximize_stability": {
        "description": "Maximize global stability by 1950",
        "success_criteria": "Geopolitical stability above 70%, minimal chaos level, no world wars",
        "target_year": 1950,
        "optimization_metric": "stability",
    },
    "prevent_wwii": {
        "description": "Prevent World War II",
        "success_criteria": "No major global conflict by 1945, Nazi Germany does not rise to power or is contained diplomatically",
        "target_year": 1945,
        "optimization_metric": "peace",
    },
    "cold_war_resolution": {
        "description": "Peacefully resolve the Cold War by 1970",
        "success_criteria": "US-Soviet tensions de-escalate, no nuclear standoffs, cooperation frameworks established",
        "target_year": 1970,
        "optimization_metric": "peace",
    },
    "accelerate_technology": {
        "description": "Accelerate technological progress",
        "success_criteria": "Major technological breakthroughs happen earlier, space exploration advanced, computing revolution accelerated",
        "target_year": 2000,
        "optimization_metric": "stability",
    },
    "prevent_2008_financial_crisis": {
        "description": "Prevent the 2008 financial crisis",
        "success_criteria": "No major financial crisis by 2008, Lehman Brothers does not collapse or is bailed out",
        "target_year": 2008,
        "optimization_metric": "stability",
    },
}


class MarathonGoal(BaseModel):
    description: str = Field(..., description="Human-readable goal description")
    success_criteria: str = Field(..., description="Specific conditions for success")
    target_year: Optional[int] = Field(None, description="Target year to reach")
    optimization_metric: Optional[Literal["stability", "chaos", "peace"]] = Field(
        None, description="What to optimize for"
    )


class MarathonConfig(BaseModel):
    goal: MarathonGoal
    max_steps: int = Field(default=10, ge=1, le=10, description="Maximum simulation steps")
    checkpoint_interval: int = Field(default=3, ge=1, le=5, description="Steps between checkpoints")
    auto_correct: bool = Field(default=True, description="Enable self-correction at checkpoints")
    starting_divergence: Optional[str] = Field(None, description="Optional starting point for the simulation")


class CheckpointEvaluation(BaseModel):
    step_number: int
    progress_score: int = Field(ge=0, le=100, description="Progress toward goal 0-100")
    on_track: bool
    deviation_analysis: str
    recommended_correction: Optional[str] = None


class MarathonStep(BaseModel):
    step_number: int
    user_input: str  # The intervention/action taken
    simulation_response: SimulationResponse
    checkpoint: Optional[CheckpointEvaluation] = None
    correction_applied: Optional[str] = None


class MarathonSession(BaseModel):
    id: str
    config: MarathonConfig
    status: Literal["idle", "running", "paused", "completed", "failed"]
    steps: List[MarathonStep] = Field(default_factory=list)
    current_world_state: Optional[WorldState] = None
    final_evaluation: Optional[str] = None
    error_message: Optional[str] = None


class MarathonStartRequest(BaseModel):
    config: MarathonConfig


class MarathonStepRequest(BaseModel):
    session: MarathonSession


class MarathonEvaluateRequest(BaseModel):
    goal: MarathonGoal
    current_state: WorldState
    step_number: int
    history_summary: str


class GoalPresetResponse(BaseModel):
    presets: dict
