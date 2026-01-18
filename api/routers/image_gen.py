from google.genai import types
from api.models import ImageResponse
from api.models import ImageRequest
from fastapi import APIRouter
from api.config import settings
from google import genai

router = APIRouter()

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
            model=settings.IMAGE_MODEL,
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