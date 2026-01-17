from fastapi import FastAPI, HTTPException, APIRouter
from google import genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field
import json
import re
from typing import Optional, List
from google.genai import types

load_dotenv(".env.local")

router = APIRouter(prefix="/api")

SIMULATION_MODEL = "gemini-3-flash-preview"
IMAGE_MODEL = "gemini-3-pro-image-preview"
AUDIO_MODEL = "gemini-2.5-flash-preview-tts"

class ChatMessage(BaseModel):
    role: str
    content: str

class WorldState(BaseModel):
    year: int
    chaos_level: int = Field(ge=0, le=100, description="Chaos level from 0 to 100")
    deviations: List[str]
    population_mood: str
    geopolitical_stability: int = Field(ge=0, le=100)

# Helper Functions
def clean_json(text: str) -> str:
    """Sanitize JSON string if the model adds backticks"""
    clean = text.strip()
    if clean.startswith('```json'):
        clean = re.sub(r'^```json', '', clean)
        clean = re.sub(r'```$', '', clean)
    elif clean.startswith('```'):
        clean = re.sub(r'^```', '', clean)
        clean = re.sub(r'```$', '', clean)
    return clean.strip()

class SimulationRequest(BaseModel):
    input: str
    history: List[ChatMessage]
    current_state: Optional[WorldState] = None

class SimulationResponse(BaseModel):
    narrative: str
    world_state_update: WorldState
    suggested_actions: List[str]

# API Endpoints
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
            model=SIMULATION_MODEL,
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

class ImageRequest(BaseModel):
    scenario_description: str

class ImageResponse(BaseModel):
    image: str | None = None

@router.post("/generate-image")
def generate_scenario_image(request: ImageRequest):
    """
    Generate a historical illustration based on scenario description
    """

    prompt = f"""Create a cinematic, oil-painting style historical illustration of this event: {request.scenario_description}. 
                   Style: Retro, vintage, muted parchment tones, highly detailed, dramatic lighting. 
                   The image should look like it belongs in an old history book."""

    try:
        client = genai.Client()

        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=types.Content(
                parts=[types.Part.from_text(text=prompt)]
            )
        )

        # Extract image data
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
                        import base64
                        image_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                        mime_type = part.inline_data.mime_type
                        return ImageResponse(image=f"data:{mime_type};base64,{image_data}")
        
        return ImageResponse(image=None)

    except Exception as e:
        print(f"Image generation failed: {e}")
        return ImageResponse(image=None)


class AudioRequest(BaseModel):
    narrative: str

class AudioResponse(BaseModel):
    audio: str | None = None

@router.post("/generate-audio")
def generate_scenario_audio(request: AudioRequest):
    """
    Generate atmospheric audio narration for a historical scene
    """

    prompt = f"""
        Voice a short, atmospheric, cinematic narration for this historical scene. 
        Tone: Deep, serious, historical documentarian.
        Scene: "{request.narrative}..."
        """

    try:
        client = genai.Client()

        response = client.models.generate_content(
            model=AUDIO_MODEL,
            contents=types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)]
            ),
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config= types.SpeechConfig(
                    voice_config=types.VoiceConfig( 
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Fenrir"
                        )
                    )
                )
            )
        )

        # Extract audio data
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
                        import base64
                        audio_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                        mime_type = part.inline_data.mime_type
                        return AudioResponse(audio=f"data:{mime_type};base64,{audio_data}")
        
        return AudioResponse(audio=None)

    except Exception as e:
        print(f"Audio generation failed: {e}")
        return AudioResponse(audio=None)

app = FastAPI()
app.include_router(router)

@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "Simulator API is running"}
