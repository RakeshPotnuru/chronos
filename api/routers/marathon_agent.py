from api.config import settings
from api.marathon_models import (
    GOAL_PRESETS,
    CheckpointEvaluation,
    GoalPresetResponse,
    MarathonConfig,
    MarathonEvaluateRequest,
    MarathonGoal,
    MarathonSession,
    MarathonStartRequest,
    MarathonStep,
    MarathonStepRequest,
)
from api.models import ChatMessage, SimulationRequest, SimulationResponse, WorldState
from api.utils import clean_json
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
import json
import uuid

router = APIRouter()


def _build_goal_aware_prompt(goal: MarathonGoal, base_input: str) -> str:
    """Enhance simulation input with goal context."""
    return f"""
MARATHON GOAL: {goal.description}
SUCCESS CRITERIA: {goal.success_criteria}
TARGET YEAR: {goal.target_year or "Not specified"}
OPTIMIZATION: {goal.optimization_metric or "General optimization"}

CURRENT ACTION/INTERVENTION:
{base_input}

Consider this action in the context of the marathon goal. Simulate the consequences while tracking progress toward the goal.
"""


def _generate_next_intervention(
    client: genai.Client,
    goal: MarathonGoal,
    current_state: WorldState,
    history_summary: str,
) -> str:
    """Auto-generate the next intervention to pursue the marathon goal."""
    
    prompt = f"""
You are a strategic planner for an alternative history simulation marathon.

GOAL: {goal.description}
SUCCESS CRITERIA: {goal.success_criteria}
TARGET YEAR: {goal.target_year or "Not specified"}
OPTIMIZATION: {goal.optimization_metric or "General"}

CURRENT WORLD STATE:
Year: {current_state.year}
Chaos Level: {current_state.chaos_level}/100
Geopolitical Stability: {current_state.geopolitical_stability}/100
Population Mood: {current_state.population_mood}
Deviations from original timeline: {', '.join(current_state.deviations)}

RECENT HISTORY:
{history_summary}

Generate the SINGLE BEST next intervention to pursue the goal.
Be specific, actionable, and historically plausible.
Consider long-term consequences and current world dynamics.

Return ONLY the intervention text, no explanation or formatting.
"""

    response = client.models.generate_content(
        model=settings.SIMULATION_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are an expert alternative history strategist. Generate concise, specific interventions.",
        ),
    )
    
    if not response.text:
        raise HTTPException(status_code=500, detail="Failed to generate next intervention")
    
    return response.text.strip()


def _evaluate_checkpoint(
    client: genai.Client,
    goal: MarathonGoal,
    current_state: WorldState,
    step_number: int,
    history_summary: str,
) -> CheckpointEvaluation:
    """Evaluate progress toward goal at a checkpoint."""
    
    prompt = f"""
Evaluate the progress of this alternative history marathon simulation.

GOAL: {goal.description}
SUCCESS CRITERIA: {goal.success_criteria}
TARGET YEAR: {goal.target_year or "Not specified"}
OPTIMIZATION METRIC: {goal.optimization_metric or "General"}

CURRENT STATE (Step {step_number}):
Year: {current_state.year}
Chaos Level: {current_state.chaos_level}/100
Geopolitical Stability: {current_state.geopolitical_stability}/100
Population Mood: {current_state.population_mood}
Deviations: {', '.join(current_state.deviations)}

HISTORY SUMMARY:
{history_summary}

Evaluate:
1. Progress score (0-100) toward the goal
2. Whether we are on track (true/false)
3. Analysis of any deviations from optimal path
4. If off-track, recommend a correction intervention

Return strict JSON only.
"""

    response = client.models.generate_content(
        model=settings.SIMULATION_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are an expert evaluator of alternative history simulations.",
            response_mime_type="application/json",
            response_schema=CheckpointEvaluation,
        ),
    )
    
    if not response.text:
        raise HTTPException(status_code=500, detail="Failed to evaluate checkpoint")
    
    cleaned = clean_json(response.text)
    result = CheckpointEvaluation(**json.loads(cleaned))
    result.step_number = step_number
    return result


def _generate_final_evaluation(
    client: genai.Client,
    goal: MarathonGoal,
    session: MarathonSession,
) -> str:
    """Generate a final evaluation of the marathon run."""
    
    history_summary = "\n".join([
        f"Step {s.step_number}: {s.user_input[:100]}... → Chaos: {s.simulation_response.world_state_update.chaos_level}, Stability: {s.simulation_response.world_state_update.geopolitical_stability}"
        for s in session.steps
    ])
    
    final_state = session.current_world_state
    
    prompt = f"""
Generate a final evaluation report for this alternative history marathon simulation.

GOAL: {goal.description}
SUCCESS CRITERIA: {goal.success_criteria}

FINAL STATE:
Year: {final_state.year if final_state else "Unknown"}
Chaos Level: {final_state.chaos_level if final_state else "Unknown"}/100
Geopolitical Stability: {final_state.geopolitical_stability if final_state else "Unknown"}/100
Deviations: {', '.join(final_state.deviations) if final_state else "None"}

JOURNEY SUMMARY ({len(session.steps)} steps):
{history_summary}

Write a compelling 2-3 paragraph evaluation:
1. Did the marathon achieve its goal?
2. What were the most impactful interventions?
3. What unexpected consequences emerged?
4. Overall assessment of this alternative timeline.

Write in the style of a historian reflecting on this divergent timeline.
"""

    response = client.models.generate_content(
        model=settings.SIMULATION_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are a master historian evaluating alternative timelines.",
        ),
    )
    
    return response.text.strip() if response.text else "Evaluation could not be generated."


def _build_history_summary(steps: list[MarathonStep]) -> str:
    """Build a concise summary of marathon history."""
    if not steps:
        return "No prior steps."
    
    summaries = []
    for step in steps[-5:]:  # Last 5 steps for context window
        state = step.simulation_response.world_state_update
        summaries.append(
            f"Step {step.step_number} ({state.year}): {step.user_input[:80]}... "
            f"[Chaos: {state.chaos_level}, Stability: {state.geopolitical_stability}]"
        )
    
    return "\n".join(summaries)


def _run_simulation_step(
    client: genai.Client,
    input_text: str,
    history: list[ChatMessage],
    current_state: WorldState | None,
) -> SimulationResponse:
    """Run a single simulation step using the existing simulation logic."""
    from api.routers.simulation_agent import (
        _build_conversation_context,
        _build_world_state_context,
        _collect_cabinet_debate,
        _build_synthesis_prompts,
        _finalize_simulation_response,
        CabinetDecision,
    )
    from api.models import SimulationRequest
    
    request = SimulationRequest(
        input=input_text,
        history=history,
        current_state=current_state,
    )
    
    conversation_context = _build_conversation_context(request)
    world_state_context = _build_world_state_context(request)
    
    cabinet_debate = _collect_cabinet_debate(
        client=client,
        request=request,
        conversation_context=conversation_context,
        world_state_context=world_state_context,
    )
    
    synthesis_system_prompt, synthesis_prompt = _build_synthesis_prompts(
        conversation_context=conversation_context,
        world_state_context=world_state_context,
        request=request,
        cabinet_debate=cabinet_debate,
    )
    
    response = client.models.generate_content(
        model=settings.SIMULATION_MODEL,
        contents=synthesis_prompt,
        config=types.GenerateContentConfig(
            system_instruction=synthesis_system_prompt,
            response_mime_type="application/json",
            response_schema=CabinetDecision,
        ),
    )
    
    if not response.text:
        raise HTTPException(status_code=500, detail="No response from simulation model")
    
    cleaned = clean_json(response.text)
    decision = CabinetDecision(**json.loads(cleaned))
    return _finalize_simulation_response(decision=decision, cabinet_debate=cabinet_debate)


@router.get("/marathon/presets", response_model=GoalPresetResponse)
def get_goal_presets():
    """Get available goal presets for quick-start marathon runs."""
    return GoalPresetResponse(presets=GOAL_PRESETS)


@router.post("/marathon/start", response_model=MarathonSession)
def start_marathon(request: MarathonStartRequest):
    """Initialize a new marathon session with the given configuration."""
    
    session_id = str(uuid.uuid4())
    
    session = MarathonSession(
        id=session_id,
        config=request.config,
        status="running",
        steps=[],
        current_world_state=None,
        final_evaluation=None,
    )
    
    return session


@router.post("/marathon/step", response_model=MarathonSession)
def execute_marathon_step(request: MarathonStepRequest):
    """Execute a single marathon step and return updated session."""
    
    session = request.session
    
    if session.status not in ["running"]:
        raise HTTPException(status_code=400, detail=f"Cannot step marathon with status: {session.status}")
    
    if len(session.steps) >= session.config.max_steps:
        session.status = "completed"
        return session
    
    try:
        client = genai.Client()
        step_number = len(session.steps) + 1
        
        # Build history from previous steps
        history: list[ChatMessage] = []
        for step in session.steps:
            history.append(ChatMessage(role="user", content=step.user_input))
            history.append(ChatMessage(role="assistant", content=step.simulation_response.narrative))
        
        history_summary = _build_history_summary(session.steps)
        
        # Generate next intervention (auto or use starting divergence for first step)
        if step_number == 1 and session.config.starting_divergence:
            next_input = session.config.starting_divergence
        else:
            next_input = _generate_next_intervention(
                client=client,
                goal=session.config.goal,
                current_state=session.current_world_state or WorldState(
                    year=1900,
                    chaos_level=20,
                    deviations=[],
                    population_mood="stable",
                    geopolitical_stability=70,
                ),
                history_summary=history_summary,
            )
        
        # Enhance input with goal context
        goal_aware_input = _build_goal_aware_prompt(session.config.goal, next_input)
        
        # Run simulation
        sim_response = _run_simulation_step(
            client=client,
            input_text=goal_aware_input,
            history=history,
            current_state=session.current_world_state,
        )
        
        # Create step record
        new_step = MarathonStep(
            step_number=step_number,
            user_input=next_input,
            simulation_response=sim_response,
        )
        
        # Check if this is a checkpoint
        if step_number % session.config.checkpoint_interval == 0:
            checkpoint = _evaluate_checkpoint(
                client=client,
                goal=session.config.goal,
                current_state=sim_response.world_state_update,
                step_number=step_number,
                history_summary=history_summary,
            )
            new_step.checkpoint = checkpoint
            
            # Apply correction if needed and auto_correct is enabled
            if session.config.auto_correct and not checkpoint.on_track and checkpoint.recommended_correction:
                new_step.correction_applied = checkpoint.recommended_correction
        
        # Update session
        session.steps.append(new_step)
        session.current_world_state = sim_response.world_state_update
        
        # Check if we've reached max steps
        if len(session.steps) >= session.config.max_steps:
            session.final_evaluation = _generate_final_evaluation(
                client=client,
                goal=session.config.goal,
                session=session,
            )
            session.status = "completed"
        
        return session
        
    except Exception as e:
        session.status = "failed"
        session.error_message = str(e)
        return session


@router.post("/marathon/evaluate", response_model=CheckpointEvaluation)
def evaluate_checkpoint(request: MarathonEvaluateRequest):
    """Manually evaluate progress at any point."""
    
    try:
        client = genai.Client()
        
        return _evaluate_checkpoint(
            client=client,
            goal=request.goal,
            current_state=request.current_state,
            step_number=request.step_number,
            history_summary=request.history_summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.post("/marathon/pause", response_model=MarathonSession)
def pause_marathon(session: MarathonSession):
    """Pause a running marathon."""
    
    if session.status != "running":
        raise HTTPException(status_code=400, detail="Can only pause running marathons")
    
    session.status = "paused"
    return session


@router.post("/marathon/resume", response_model=MarathonSession)
def resume_marathon(session: MarathonSession):
    """Resume a paused marathon."""
    
    if session.status != "paused":
        raise HTTPException(status_code=400, detail="Can only resume paused marathons")
    
    session.status = "running"
    return session
