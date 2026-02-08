from api.config import settings
from api.models import FactCheckRequest, FactCheckResponse
from api.utils import clean_json
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
import json

router = APIRouter()

LIBRARIAN_SYSTEM_PROMPT = """
You are The Librarian, a rigorous fact-checker for alternative history narratives.
Your goal is to compare a user-provided narrative against REAL Earth history using Google Search.

You must break the narrative down into distinct segments and classify each as:
- "verified": The statement is true in real history (e.g., "JFK was elected in 1960").
- "divergent": The statement contradicts real history (e.g., "JFK lost the 1960 election").
- "plausible": The statement is fictional but fits the historical context plausibly (e.g., specific fictional dialogue or minor undocumented details).

For each "divergent" or "plausible" segment, verify what ACTUALLY happened in real history if applicable.
"""

@router.post("/fact-check", response_model=FactCheckResponse)
def fact_check_narrative(request: FactCheckRequest):
    """
    Analyzes a narrative segment to distinguish real history from simulation/fiction.
    Uses Google Search grounding to verify claims.
    """
    try:
        client = genai.Client()
        
        prompt = f"""
        Analyze the following alternative history narrative segment:
        
        "{request.narrative}"
        
        Context Year: {request.year}
        
        1. Break the text into logical segments (sentences or phrases).
        2. Use Google Search to verify each major claim.
        3. Classify each segment as 'verified' (green), 'divergent' (purple), or 'plausible' (neutral/purple).
        4. For divergent items, briefly state the real historical event foundation if it exists.
        
        Return strict JSON matching the FactCheckResponse schema.
        """

        response = client.models.generate_content(
            model=settings.SIMULATION_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=LIBRARIAN_SYSTEM_PROMPT,
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                response_schema=FactCheckResponse,
            ),
        )

        if not response.text:
             raise HTTPException(status_code=500, detail="No response from Librarian agent")

        cleaned_text = clean_json(response.text)
        return FactCheckResponse(**json.loads(cleaned_text))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fact-check failed: {str(e)}")
