from google.genai import types
from api.models import VideoPromptRequest, VideoPromptResponse
from fastapi import APIRouter
from api.config import settings
from google import genai

router = APIRouter()

@router.post("/generate-video-prompt")
def generate_video_prompt(request: VideoPromptRequest):
    """
    Generate a cinematic video prompt based on simulation responses using Veo 3.1 best practices.
    
    Follows Google Cloud's ultimate prompting guide for Veo 3.1:
    - Detailed scene descriptions with camera angles
    - Lighting and color mood specifications
    - Motion and pacing directives
    - Temporal coherence across shots
    """
    
    # Extract narrative content from messages
    messages_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in request.conversation_history
    ])
    
    # Build context-aware prompt based on configuration
    style_guidance = {
        "cinematic": "Epic, widescreen composition with dramatic lighting. Use slow, purposeful camera movements. Golden hour lighting with deep shadows and warm color grades.",
        "documentary": "Handheld, intimate camera work with natural lighting. Medium shots with occasional close-ups. Muted, realistic color palette with subtle grading.",
        "vintage": "Grainy 16mm film aesthetic with vintage color grading. Static or subtle pan shots. Sepia or desaturated tones with film scratches and light leaks.",
        "dramatic": "High contrast noir-style lighting with deep blacks. Dynamic camera angles including Dutch tilts. Saturated colors with strong color temperature shifts.",
        "historical": "Period-accurate production design with natural, diffused lighting. Traditional camera framing. Authentic color palette matching the historical era."
    }
    
    duration_guidance = {
        "short": "5-8 seconds. Single continuous shot or 2 quick cuts maximum.",
        "medium": "10-15 seconds. Allow for 2-3 establishing shots with smooth transitions.",
        "long": "20-30 seconds. Multiple scene elements with complex camera movements and scene progression."
    }
    
    motion_guidance = {
        "static": "Minimal camera movement. Locked-off shot or subtle drift. Let action unfold within frame.",
        "slow": "Graceful, smooth camera movements. Slow dolly push-in or pull-out. Gentle panning to reveal elements.",
        "dynamic": "Bold camera movements including sweeping crane shots, tracking shots, or rapid pans. High energy."
    }
    
    style = style_guidance.get(request.config.style, style_guidance["cinematic"])
    duration = duration_guidance.get(request.config.duration, duration_guidance["medium"])
    motion = motion_guidance.get(request.config.motion, motion_guidance["slow"])
    
    # Build optional elements
    optional_elements = []
    if request.config.include_text_overlay:
        optional_elements.append("Include elegant text overlay displaying the year and location in serif font, positioned in lower third.")
    if request.config.include_voiceover:
        optional_elements.append("Pacing should accommodate narrative voiceover with natural pauses for emphasis.")
    if request.config.focus_on_emotion:
        optional_elements.append("Emphasize human emotional reactions and character expressions. Show faces and body language clearly.")
    
    optional_text = "\n".join(optional_elements) if optional_elements else ""
    
    # Main prompt construction following Veo 3.1 best practices
    prompt = f"""You are a master cinematographer and video director. Based on the following historical simulation conversation, create a single, detailed video generation prompt optimized for Veo 3.1.

CONVERSATION CONTEXT:
{messages_context}

VISUAL STYLE DIRECTION:
{style}

DURATION & PACING:
{duration}

CAMERA MOVEMENT:
{motion}

{optional_text}

Your task: Generate a single cohesive video prompt (150-250 words) that:
1. Opens with a clear establishing shot description
2. Specifies exact camera angles, movements, and framing
3. Details lighting conditions and color mood
4. Describes foreground, midground, background elements
5. Includes atmospheric details (weather, time of day, ambient effects)
6. Specifies the temporal flow and any transitions
7. Creates cinematic tension and visual storytelling
8. Uses precise, concrete visual language (avoid abstract concepts)
9. Maintains historical authenticity while being visually compelling

CRITICAL REQUIREMENTS:
- Be extremely specific about WHAT is visible in frame
- Specify camera technical details (shot type, angle, movement)
- Describe HOW elements move through the scene
- Include sensory details that translate to visual atmosphere
- Avoid vague terms; use precise descriptive language
- Structure as a continuous visual sequence, not separate ideas

Generate only the video prompt, nothing else. Make it worthy of a historical documentary film."""

    try:
        client = genai.Client()
        
        response = client.models.generate_content(
            model=settings.SIMULATION_MODEL,
            contents=types.Content(
                parts=[types.Part.from_text(text=prompt)]
            ),
        )
        
        # Extract generated video prompt
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                video_prompt = ""
                for part in candidate.content.parts:
                    if hasattr(part, 'text') and part.text:
                        video_prompt += part.text
                
                if video_prompt:
                    return VideoPromptResponse(
                        video_prompt=video_prompt.strip(),
                        metadata={
                            "style": request.config.style,
                            "duration": request.config.duration,
                            "motion": request.config.motion,
                            "conversation_length": len(request.conversation_history)
                        }
                    )
        
        return VideoPromptResponse(
            video_prompt=None,
            metadata={"error": "Failed to generate video prompt"}
        )
    
    except Exception as e:
        print(f"Video prompt generation failed: {e}")
        return VideoPromptResponse(
            video_prompt=None,
            metadata={"error": str(e)}
        )
