from api.models import AudioResponse
from api.models import AudioRequest
from fastapi import APIRouter
from api.config import settings
from google import genai
from google.genai import types

router = APIRouter()

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
            model=settings.AUDIO_MODEL,
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