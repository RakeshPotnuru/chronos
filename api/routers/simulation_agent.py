from api.config import settings
from google.genai import types
from api.utils import clean_json
from api.models import AdvisorOpinion
from api.models import AdvisorRecommendation
from api.models import CabinetDecision
from api.models import SimulationRequest
from api.models import SimulationResponse
from fastapi import HTTPException
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json
from google import genai
from typing import Any, Generator, Iterable

router = APIRouter()


ADVISOR_SYSTEM_PROMPTS = {
    "economist": """
    You are the Economist Advisor for an alternative-history cabinet.
    Focus on trade, inflation, labor markets, industrial capacity, fiscal/monetary effects, and long-run growth.
    """,
    "military": """
    You are the Military Advisor for an alternative-history cabinet.
    Focus on force readiness, strategic deterrence, logistics, conflict escalation risk, and security doctrine.
    """,
    "diplomat": """
    You are the Diplomat Advisor for an alternative-history cabinet.
    Focus on alliances, treaty systems, legitimacy, soft power, negotiation pathways, and coalition behavior.
    """,
    "public_sentiment": """
    You are the Public Sentiment Advisor for an alternative-history cabinet.
    Focus on social cohesion, media narratives, trust in institutions, protests, and population mood shifts.
    """,
}


def _build_synthesis_prompts(
    conversation_context: str, world_state_context: str, request: SimulationRequest, cabinet_debate: list[AdvisorOpinion]
) -> tuple[str, str]:
    synthesis_system_prompt = f"""
    You are Chronos, an expert Historian and Chaos Theory Simulator.
    You chair a cabinet of specialized advisors and must select ONE intervention from their proposals.

    Constraints:
    - Be historically plausible; no magic or impossible technology leaps.
    - Model geopolitical, social, military, and economic consequences.
    - Use chaos theory logic: small divergences may cascade over time.

    World State:
    {world_state_context}

    Turn Rules:
    - If first divergence, set year to event year and describe immediate effects.
    - If continuation, advance time as appropriate and update state coherently.
    - Keep suggested_actions as practical next-turn options.
    """

    synthesis_prompt = f"""
    CONVERSATION CONTEXT:
    {conversation_context}

    USER ACTION / DIVERGENCE:
    {request.input}

    CABINET DEBATE JSON:
    {json.dumps([entry.model_dump() for entry in cabinet_debate])}

    Return strict JSON with keys:
    narrative, world_state_update, suggested_actions, selected_intervention, decision_rationale
    """

    return synthesis_system_prompt, synthesis_prompt


def _build_conversation_context(request: SimulationRequest) -> str:
    context = "\n".join(
        [
            f"{msg.role.upper()}: {msg.content}"
            for msg in request.history
            if msg.role != "system"
        ]
    )
    return context if context else "No prior conversation."


def _build_world_state_context(request: SimulationRequest) -> str:
    if request.current_state:
        return json.dumps(request.current_state.model_dump())
    return "No divergence yet. Standard Earth history."


def _generate_advisor_opinion(
    client: genai.Client,
    advisor: str,
    advisor_system_prompt: str,
    conversation_context: str,
    world_state_context: str,
    user_input: str,
) -> AdvisorOpinion:
    advisor_prompt = f"""
    CONVERSATION CONTEXT:
    {conversation_context}

    CURRENT WORLD STATE:
    {world_state_context}

    USER ACTION / DIVERGENCE:
    {user_input}

    Provide one intervention recommendation from your advisory lens.
    Return strict JSON only. Keep reasoning concise and grounded in historical plausibility.
    """

    response = client.models.generate_content(
        model=settings.SIMULATION_MODEL,
        contents=advisor_prompt,
        config=types.GenerateContentConfig(
            system_instruction=advisor_system_prompt,
            response_mime_type="application/json",
            response_schema=AdvisorRecommendation,
        ),
    )

    if not response.text:
        raise HTTPException(
            status_code=500,
            detail=f"No response from {advisor} advisor model",
        )

    cleaned_text = clean_json(response.text)
    parsed = AdvisorRecommendation(**json.loads(cleaned_text))
    return AdvisorOpinion(advisor=advisor, **parsed.model_dump())


def _collect_cabinet_debate(
    client: genai.Client, request: SimulationRequest, conversation_context: str, world_state_context: str
) -> list[AdvisorOpinion]:
    cabinet_debate: list[AdvisorOpinion] = []
    for advisor, advisor_system_prompt in ADVISOR_SYSTEM_PROMPTS.items():
        cabinet_debate.append(
            _generate_advisor_opinion(
                client=client,
                advisor=advisor,
                advisor_system_prompt=advisor_system_prompt,
                conversation_context=conversation_context,
                world_state_context=world_state_context,
                user_input=request.input,
            )
        )
    return cabinet_debate


def _finalize_simulation_response(
    decision: CabinetDecision, cabinet_debate: list[AdvisorOpinion]
) -> SimulationResponse:
    intervention_options = {entry.intervention for entry in cabinet_debate}
    selected_intervention = decision.selected_intervention
    decision_rationale = decision.decision_rationale

    if selected_intervention not in intervention_options:
        fallback = max(cabinet_debate, key=lambda entry: entry.confidence).intervention
        selected_intervention = fallback
        decision_rationale = (
            f"{decision_rationale} Selected intervention normalized to cabinet consensus fallback."
        )

    return SimulationResponse(
        narrative=decision.narrative,
        world_state_update=decision.world_state_update,
        suggested_actions=decision.suggested_actions,
        cabinet_debate=cabinet_debate,
        selected_intervention=selected_intervention,
        decision_rationale=decision_rationale,
    )


def _sse_event(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _iter_chunk_parts(chunk: Any) -> Iterable[Any]:
    candidates = getattr(chunk, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", None) or []:
            yield part


def _extract_part_fields(part: Any) -> tuple[str, bool, str | None]:
    text = getattr(part, "text", None) or ""
    is_thought = bool(getattr(part, "thought", False))
    signature = (
        getattr(part, "thought_signature", None)
        or getattr(part, "thoughtSignature", None)
        or getattr(part, "thought_signature_", None)
    )
    if isinstance(signature, bytes):
        signature = signature.decode("utf-8", errors="ignore")
    return text, is_thought, signature


@router.post("/simulate-turn", response_model=SimulationResponse)
def simulate_turn(request: SimulationRequest):
    """
    Simulate an alternative history turn based on user input.
    A multi-agent cabinet debates interventions before one is selected.
    """

    try:
        client = genai.Client()
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

        cleaned_text = clean_json(response.text)
        decision = CabinetDecision(**json.loads(cleaned_text))
        return _finalize_simulation_response(decision=decision, cabinet_debate=cabinet_debate)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse simulation JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/simulate-turn-stream")
def simulate_turn_stream(request: SimulationRequest):
    """
    Stream cabinet progress, thought summaries/signatures, and answer deltas.
    Final event is type=done with full SimulationResponse payload.
    """

    def event_stream() -> Generator[str, None, None]:
        try:
            client = genai.Client()
            conversation_context = _build_conversation_context(request)
            world_state_context = _build_world_state_context(request)

            yield _sse_event({"type": "stage", "message": "Assembling cabinet advisors"})
            cabinet_debate: list[AdvisorOpinion] = []

            for advisor, advisor_system_prompt in ADVISOR_SYSTEM_PROMPTS.items():
                opinion = _generate_advisor_opinion(
                    client=client,
                    advisor=advisor,
                    advisor_system_prompt=advisor_system_prompt,
                    conversation_context=conversation_context,
                    world_state_context=world_state_context,
                    user_input=request.input,
                )
                cabinet_debate.append(opinion)
                yield _sse_event(
                    {
                        "type": "advisor_ready",
                        "advisor": advisor,
                        "confidence": opinion.confidence,
                        "intervention": opinion.intervention,
                    }
                )

            synthesis_system_prompt, synthesis_prompt = _build_synthesis_prompts(
                conversation_context=conversation_context,
                world_state_context=world_state_context,
                request=request,
                cabinet_debate=cabinet_debate,
            )

            yield _sse_event({"type": "stage", "message": "Synthesizing timeline response"})

            answer_buffer = ""
            stream = client.models.generate_content_stream(
                model=settings.SIMULATION_MODEL,
                contents=synthesis_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=synthesis_system_prompt,
                    response_mime_type="application/json",
                    thinking_config=types.ThinkingConfig(include_thoughts=True),
                ),
            )

            for chunk in stream:
                for part in _iter_chunk_parts(chunk):
                    text, is_thought, signature = _extract_part_fields(part)

                    if signature:
                        yield _sse_event({"type": "signature", "signature": signature})

                    if not text:
                        continue

                    if is_thought:
                        yield _sse_event({"type": "thought_delta", "text": text})
                    else:
                        answer_buffer += text
                        yield _sse_event({"type": "answer_delta", "text": text})

            if not answer_buffer:
                raise ValueError("No final answer text was returned by stream")

            decision = CabinetDecision(**json.loads(clean_json(answer_buffer)))
            final_response = _finalize_simulation_response(
                decision=decision, cabinet_debate=cabinet_debate
            )
            yield _sse_event({"type": "done", "payload": final_response.model_dump()})

        except Exception as e:
            yield _sse_event({"type": "error", "message": f"Simulation failed: {str(e)}"})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
