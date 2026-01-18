from api.config import settings
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from api.routers import simulation, image_gen, audio_gen

load_dotenv(".env.local")

router = APIRouter(prefix="/api")
router.include_router(simulation.router)
router.include_router(image_gen.router)
router.include_router(audio_gen.router)

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
