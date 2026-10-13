import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent

# Database configuration
DATABASE_PATH = os.getenv("DATABASE_PATH", str(WORKSPACE_DIR / "dukaanpilot.db"))

# Ollama / AI configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2:2b")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "6.0"))

# Server configuration
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# CORS Origins
raw_cors = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

# Static Files (for Render production single-service deployment)
STATIC_DIR = os.getenv("STATIC_DIR", str(WORKSPACE_DIR / "frontend" / "dist"))

# Public Demo Mode & Safety
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
