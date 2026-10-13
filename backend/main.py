import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import CORS_ORIGINS, STATIC_DIR
from backend.app.database import init_db
from backend.app.routers import (
    orders,
    expenses,
    invoices,
    analytics,
    ai,
    settings
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema and default records
    init_db()
    yield

app = FastAPI(
    title="DukaanPilot AI API",
    description="AI-powered business assistant for small online sellers, Instagram shops, and WhatsApp entrepreneurs.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(orders.router)
app.include_router(expenses.router)
app.include_router(invoices.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(settings.router)

# Health-check endpoints
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DukaanPilot AI Backend",
        "version": "1.0.0"
    }

# Serve Frontend in Production if built (e.g., on Render single-service)
if os.path.exists(STATIC_DIR):
    # Mount assets folder
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build not found"}

if __name__ == "__main__":
    import uvicorn
    from backend.app.config import HOST, PORT
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
