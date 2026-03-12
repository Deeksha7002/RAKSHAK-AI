import os
import logging
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import init_db
from dependencies import get_db, _prune_stale_challenges, manager, get_current_user
from contextlib import asynccontextmanager
import asyncio

# Import Routers
from routers import auth, agent, stats, webhooks
from dependencies import get_db, _prune_stale_challenges, manager, get_current_user
from limiter_config import limiter

# ── Lifespan & Initialization ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_db()
    logging.info("🚀 Rakshak AI Core Initialized")
    
    # 1. Start Challenge Pruner
    import asyncio
    stop_event = asyncio.Event()
    
    async def prune_loop():
        while not stop_event.is_set():
            try:
                # Use context manager style to ensure closing
                from database import SessionLocal
                db = SessionLocal()
                try:
                    _prune_stale_challenges(db)
                finally:
                    db.close()
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

# FIX: Restricted CORS for PhonePe-grade security
# Only allow official frontend and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://rakshak-ai-drab.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True, # Set to True as we are specifying origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate Limiter Handling ────────────────────────────────────────────────────
app.state.limiter = limiter
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

@app.get("/api/debug/db-schema")
async def debug_db_schema(reset: bool = False, current_user: str = Depends(get_current_user)):
    """Diagnostic endpoint to check and optionally reset production DB schema. Requires admin auth."""
    from database import engine, Base, SessionLocal, User
    from sqlalchemy import inspect

    # FIX #5: Require authentication and admin role
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == current_user).first()
        if not user or user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
    finally:
        db.close()

    if reset:
        logging.warning("🚨 EMERGENCY DATABASE RESET TRIGGERED!")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        return {"status": "reset", "msg": "Database tables dropped and recreated."}

    inspector = inspect(engine)
    report = {}
    for table_name in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns(table_name)]
        report[table_name] = columns
    return report

@app.get("/")
def read_root():
    return {"status": "active", "system": "Cyber Cell Core", "version": "2.0.0 (Fortified)"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
