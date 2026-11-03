import os
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

app = FastAPI(
    title="AI IT Support Resolution Agent API",
    description="POC IT Support Agent powered by LangGraph, Groq Llama 3.3 70B, and Embeddings-based RAG.",
    version="1.0.0",
)

# Enable CORS for local Vite dev and container environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes at root (as requested by spec) and /api
app.include_router(router)
app.include_router(router, prefix="/api")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-it-support-agent",
        "model": "llama-3.3-70b-versatile",
        "framework": "LangGraph + FastAPI"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
