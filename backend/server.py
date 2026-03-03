import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import init_db
from dependencies import get_db, _prune_stale_challenges, manager
from contextlib import asynccontextmanager
import asyncio

# Import Routers
from routers import auth, agent, stats, webhooks

# ── Lifespan & Initialization ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB
    init_db()
    logging.info("🚀 Rakshak AI Core Initialized")
    
    # Optional: Start background task for challenge pruning
    # In a real production app, you might use a separate worker/cron,
    # but for this deployment, we can use an asyncio task.
    import asyncio
    stop_event = asyncio.Event()
    
    # 1. Start Challenge Pruner
    async def prune_loop():
        while not stop_event.is_set():
            try:
                db_gen = get_db()
                db = next(db_gen)
                _prune_stale_challenges(db)
            except Exception as e:
                logging.error(f"Challenge pruning failed: {e}")
            await asyncio.sleep(60)

    pruner = asyncio.create_task(prune_loop())

    # 2. Start Redis Pub/Sub Listener (for multi-server Sync)
    sync_task = asyncio.create_task(manager.pubsub_listener())
    
    yield
    
    # Shutdown
    stop_event.set()
    pruner.cancel()
    sync_task.cancel()
    logging.info("👋 Rakshak AI Core Shutting Down")

app = FastAPI(title="Rakshak AI Cyber Cell API", lifespan=lifespan)

# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    os.environ.get("FRONTEND_URL", "https://rakshak-ai-drab.vercel.app"),
    "https://rakshak-ai-drab.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate Limiter Handling ────────────────────────────────────────────────────
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"❌ CRITICAL SERVER ERROR: {exc}", exc_info=True)
    return {"status": "error", "detail": "Internal Server Error", "msg": str(exc)}

# ── Security Middleware ──────────────────────────────────────────────────────
@app.middleware("http")
async def secure_headers_and_obfuscation(request: Request, call_next):
    try:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Server"] = "Rakshak-Core/2.0"  # Obfuscation
        return response
    except Exception as e:
        import traceback
        logging.error(f"❌ MIDDLEWARE CRASH: {e}\n{traceback.format_exc()}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error_type": type(e).__name__, "msg": str(e), "traceback": traceback.format_exc()}
        )

# ── Route Registration ───────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(agent.router)
app.include_router(stats.router)
app.include_router(webhooks.router)

@app.get("/")
def read_root():
    return {"status": "active", "system": "Cyber Cell Core", "version": "2.0.0 (Fortified)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
