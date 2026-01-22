import sys
from pathlib import Path

# Add project root to sys.path to support absolute 'api.' imports
# when running the file directly.
root_path = Path(__file__).resolve().parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from api.config import settings
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from api.routers import simulation_agent, image_agent, audio_agent

load_dotenv(".env.local")

router = APIRouter(prefix="/api")
router.include_router(simulation_agent.router)
router.include_router(image_agent.router)
router.include_router(audio_agent.router)

app = FastAPI(title=settings.PROJECT_NAME)

origins = []

client_url = os.getenv("CLIENT_URL")
if client_url:
    origins.append(client_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "Chronos API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=settings.PORT, log_level="info", reload=True)