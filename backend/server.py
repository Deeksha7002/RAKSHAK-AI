import os
import logging

# Ensure INFO level logs are visible on Render
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import init_db
from dependencies import get_db, _prune_stale_challenges, manager, get_current_user
from contextlib import asynccontextmanager
import asyncio

# Import Routers explicitly
from routers.auth_router import router as auth_router
from routers.agent_router import router as agent_router
from routers.stats_router import router as stats_router
from routers.webhooks_router import router as webhooks_router
from routers.integration_router import router as integration_router
from dependencies import get_db, _prune_stale_challenges, manager, get_current_user
from limiter_config import limiter

# ── Lifespan & Initialization ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_db()

    # Download required TextBlob corpora synchronously to guarantee disk presence
    try:
        import nltk
        
        # Explicitly define a relative path for dictionary loading to avoid OS ambient gaps
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nltk_data")
        os.makedirs(data_dir, exist_ok=True)
        if data_dir not in nltk.data.path:
            nltk.data.path.append(data_dir)

        import ssl
        try:
            _create_unverified_https_context = ssl._create_unverified_context
        except AttributeError:
            pass
        else:
            ssl._create_default_https_context = _create_unverified_https_context
            
        logging.info(f"⏳ Downloading TextBlob Corpora into {data_dir}...")
        corpora = ['punkt', 'averaged_perceptron_tagger', 'brown', 'wordnet', 'conll2000', 'movie_reviews']
        for corpus in corpora:
            nltk.download(corpus, download_dir=data_dir, quiet=True)
            
        logging.info("✅ NLTK & TextBlob corpora verified.")
    except Exception as e:
        logging.warning(f"⚠️ TextBlob download skipped/failed: {e}")

    logging.info("🚀 Rakshak AI Core Initialized")
    
    # 1. Background Task Management
    stop_event = asyncio.Event()
    tasks = []

    # 1.1 Start Challenge Pruner
    async def prune_loop():
        while not stop_event.is_set():
            try:
                from database import SessionLocal
                with SessionLocal() as db:
                    _prune_stale_challenges(db)
            except Exception as e:
                logging.error(f"Challenge pruning failed: {e}")
            await asyncio.sleep(60)
    tasks.append(asyncio.create_task(prune_loop()))

    # 1.2 Start Agent Simulation (if enabled)
    if os.environ.get("ENABLE_AGENT_SIMULATION") == "1":
        from agent import RakshakAgent
        from mock_api import MockScammerAPI
        
        async def agent_loop():
            logging.info("🤖 Rakshak AI Agent Simulation Started")
            api = MockScammerAPI()
            agent = RakshakAgent()
            while not stop_event.is_set():
                try:
                    # Run the simulation step (blocking-ish, so we keep sleep short)
                    msg_data = api.get_new_message()
                    if msg_data:
                        logging.info(f"--- Agent Ingesting: {msg_data['conversation_id']} ---")
                        classification = agent.ingest(msg_data)
                        if classification in ["scam", "likely_scam"]:
                            response = agent.generate_response(msg_data['conversation_id'])
                            if response:
                                api.send_message(msg_data['conversation_id'], response)
                except Exception as e:
                    logging.error(f"Agent simulation error: {e}")
                await asyncio.sleep(2)
        tasks.append(asyncio.create_task(agent_loop()))

    # 1.3 Start Redis Sync
    tasks.append(asyncio.create_task(manager.pubsub_listener()))
    
    yield
    
    # Shutdown
    stop_event.set()
    for task in tasks:
        task.cancel()
    logging.info("👋 Rakshak AI Core Shutting Down")

app = FastAPI(title="Rakshak AI Cyber Cell API", lifespan=lifespan)

# FIX: Restricted CORS for PhonePe-grade security
# Only allow official frontend and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
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
app.include_router(auth_router, prefix="/api")
app.include_router(agent_router)
app.include_router(stats_router)
app.include_router(webhooks_router)
app.include_router(integration_router) # Shadow Intel Intake

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

@app.get("/api/debug/routes")
async def list_routes():
    """List all registered routes for diagnostics."""
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": list(route.methods) if hasattr(route, "methods") else None
        })
    return {"routes": routes}

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"status": "active", "system": "Cyber Cell Core", "version": "2.0.2 (Explicit)"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    """Standard health check endpoint for Render and uptime monitors."""
    return {"status": "ok", "system": "Rakshak AI Core", "version": "2.0.3"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
