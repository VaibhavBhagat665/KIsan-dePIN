# ============================================================
# Kisan-DePIN Backend — FastAPI Entry Point
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import analyze, rag

app = FastAPI(
    title="Kisan-DePIN API",
    description="AI Computer Vision & Agentic RAG backend for D-MRV verification",
    version="0.1.0",
)

# CORS — allow frontend on any port during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(analyze.router, prefix="/api/v1", tags=["AI Analysis"])
app.include_router(rag.router, prefix="/api/v1", tags=["Agentic RAG"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "kisan-depin-backend", "version": "0.1.0"}
