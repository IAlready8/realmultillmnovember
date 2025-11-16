from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import structlog
from typing import List, Literal

from .config import settings
from .caching import get_redis_client, test_redis_connection
from .schemas import (
    HealthResponse,
    MultiProviderRequest,
    ProviderRequest,
    ProviderResponse,
)
from .providers import execute_llm_request

# --- Application Setup ---
app = FastAPI(
    title="RealMultiLLM Python Core",
    description="High-performance LLM orchestration sidecar.",
    version="0.1.0",
)

log = structlog.get_logger(__name__)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Application State ---
@app.on_event("startup")
async def startup_event():
    """On startup, test external service connections."""
    log.info("Python Core service starting up...", env=settings.NODE_ENV)
    asyncio.create_task(test_redis_connection())

@app.on_event("shutdown")
async def shutdown_event():
    """On shutdown, clean up resources."""
    log.info("Python Core service shutting down.")
    # Clients will close automatically


# --- API Endpoints ---

@app.get("/api/v1/health", response_model=HealthResponse)
async def get_health():
    """
    Health check endpoint for PM2 and the Next.js app.
    """
    redis_status: Literal["ok", "error"] = "ok" if await test_redis_connection() else "error"
    
    services = {
        "redis": redis_status,
        "openai_api": "ok", # TODO: Implement real provider health checks
    }
    
    overall_status: Literal["ok", "error"] = "ok" if "error" not in services.values() else "error"
    
    return HealthResponse(status=overall_status, services=services)


@app.post("/api/v1/llm/chat", response_model=ProviderResponse)
async def post_chat(request: ProviderRequest):
    """
    Processes a single, non-streaming LLM request.
    Caches the response.
    """
    log.info("Received chat request", provider=request.provider, model=request.model)
    
    # TODO: Add Redis caching layer here
    
    response = await execute_llm_request(request)
    return response


@app.post("/api/v1/llm/orchestrate", response_model=List[ProviderResponse])
async def post_orchestrate(request: MultiProviderRequest):
    """
    Processes multiple LLM requests in parallel.
    """
    log.info("Received orchestration request", models=len(request.requests))
    
    # Run all requests concurrently
    tasks = [execute_llm_request(req) for req in request.requests]
    results = await asyncio.gather(*tasks)
    
    return results

# TODO: Add /api/v1/llm/stream endpoint