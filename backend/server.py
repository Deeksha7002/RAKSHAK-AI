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
    # 🛠️ Database Auto-Migration Logic ─────────────────────────────────────────
    # Since SQLAlchemy metadata.create_all() doesn't add missing columns,
    # we manually execute ALTER TABLE commands for our latest schema update.
    try:
        from database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            logging.info("🛠️ Running schema migration checks...")
            # 'cases' table updates
            conn.execute(text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
            conn.execute(text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS classification VARCHAR"))
            conn.execute(text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS scam_type VARCHAR"))
            conn.execute(text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS confidence_score FLOAT"))
            conn.execute(text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS conversation_id VARCHAR"))
            # 'stats' table updates
            conn.execute(text("ALTER TABLE stats ADD COLUMN IF NOT EXISTS total_intercepted INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE stats ADD COLUMN IF NOT EXISTS scams_prevented INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE stats ADD COLUMN IF NOT EXISTS safe_conversations INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE stats ADD COLUMN IF NOT EXISTS current_threat_level FLOAT DEFAULT 0.1"))
            conn.commit()
            logging.info("✅ Database schema synchronized.")
    except Exception as e:
        logging.warning(f"⚠️ Migration warning (may already exist): {e}")

    # Startup logic
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

# ── GLOBAL DEBUG TOGGLE ───────────────────────────────────────────────────────
# Set to "1" to see full tracebacks in JSON responses during production debugging.
os.environ["DEBUG_MODE"] = "1"

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
    import traceback
    error_trace = traceback.format_exc()
    logging.error(f"❌ CRITICAL SERVER ERROR: {exc}\n{error_trace}")
    from fastapi.responses import JSONResponse
    content = {
        "status": "error",
        "detail": "Internal Server Error",
        "error_type": type(exc).__name__,
        "msg": str(exc)
    }
    # Add traceback ONLY in development or if diagnostic flag is set
    if os.environ.get("DEBUG_MODE") == "1":
        content["traceback"] = error_trace
        
    return JSONResponse(status_code=500, content=content)

# ── Security Middleware ──────────────────────────────────────────────────────
@app.middleware("http")
async def secure_headers_and_obfuscation(request: Request, call_next):
    # This middleware should NOT catch exceptions; let the global_exception_handler do it
    # to ensure CORS and other internal middlewares are respected on the response path.
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Server"] = "Rakshak-Core/2.0"
    return response

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
