import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SIMULATION_MODEL: str = "gemini-3-flash-preview"
    # IMAGE_MODEL: str = "gemini-3-pro-image-preview"
    IMAGE_MODEL: str = "gemini-2.5-flash-image"
    AUDIO_MODEL: str = "gemini-2.5-flash-preview-tts"

    PROJECT_NAME: str = "Chronos API"
    PORT: int = int(os.getenv("PORT", default=8000))

settings = Settings()
