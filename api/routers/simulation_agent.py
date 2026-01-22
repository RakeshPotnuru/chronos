from api.config import settings
from google.genai import types
from api.utils import clean_json
from api.models import SimulationRequest
from api.models import SimulationResponse
from fastapi import HTTPException
from fastapi import APIRouter
import json
from google import genai

router = APIRouter()

@router.post("/simulate-turn", response_model=SimulationResponse)
def simulate_turn(request: SimulationRequest):
    """
    Simulate an alternative history turn based on user input
    """

    system_prompt = f"""
    You are Chronos, an expert Historian and Chaos Theory Simulator.
    Your task is to simulate alternative history scenarios based on user input.
    
    Constraint: Be historically plausible. Do not allow magic. Focus on geopolitical, social, and economic consequences.
    Use Chaos Theory principles: small divergences can lead to large unexpected outcomes (Butterfly Effect).
    
    Current World State (if any):
    {json.dumps(request.current_state.model_dump()) if request.current_state else "No divergence yet. Standard Earth history."}

    The user will provide a divergence point or an action.
    You must predict the outcome.
    
    If this is the first divergence:
    - Set the year to the divergence event.
    - Describe the immediate outcome.
    
    If continuing:
    - Advance time appropriately (immediate aftermath -> 10 years -> 50 years -> 100 years, or as requested).
    - Update the Chaos Level (0 = historical baseline, 100 = total collapse/unrecognizable world).
    - List key historical deviations (events that happened differently or didn't happen).

    You MUST return the response in strict JSON format.
    """

    # Construct conversation context
    conversation_context = "\n".join([
        f"{msg.role.upper()}: {msg.content}"
        for msg in request.history
        if msg.role != 'system'
    ])

    final_prompt = f"""
    {conversation_context}
    USER: {request.input}
    
    Respond with a JSON object conforming to this schema. Do not include markdown formatting outside the JSON.
    """

    try:
        client = genai.Client()

        response = client.models.generate_content(
            model=settings.SIMULATION_MODEL,
            contents=final_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=SimulationResponse,
            ),
        )
        
        if not response.text:
            raise HTTPException(status_code=500, detail="No response from simulation model")

        # Parse the JSON response
        cleaned_text = clean_json(response.text)
        result = json.loads(cleaned_text)
        
        # Convert to Pydantic model
        return SimulationResponse(**result)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse simulation JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
