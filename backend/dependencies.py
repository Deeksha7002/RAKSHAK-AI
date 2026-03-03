import os
import redis
import logging
from typing import List, Optional
from fastapi import WebSocket, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import SessionLocal, User
from agent import RakshakAgent
from analyzer import ScamAnalyzer
import security

# ── Auth Helper ────────────────────────────────────────────────────────────────
_bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme)) -> Optional[str]:
    """Decodes JWT and returns the username, or None if unauthenticated."""
    if not credentials:
        return None
    payload = security.decode_access_token(credentials.credentials)
    return payload.get("sub") if payload else None

# ── WebAuthn Challenge Pruning ─────────────────────────────────────────────────
def _prune_stale_challenges(db: Session):
    """Background task: delete WebAuthn challenges older than 5 minutes."""
    from datetime import datetime, timedelta, timezone as tz
    from database import WebAuthnChallenge
    try:
        threshold = datetime.now(tz.utc) - timedelta(minutes=5)
        deleted = db.query(WebAuthnChallenge).filter(WebAuthnChallenge.created_at < threshold).delete()
        if deleted > 0:
            db.commit()
            logging.info(f"🧹 Pruned {deleted} stale WebAuthn challenges from DB.")
    except Exception as e:
        logging.error(f"❌ Failed to prune challenges: {e}")

# ── Database Dependency ────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── WebSocket Manager ──────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logging.info(f"🆕 New WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logging.info(f"🔌 WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logging.error(f"Failed to broadcast to a client: {e}")

manager = ConnectionManager()

# ── Core Analyzer Instance ─────────────────────────────────────────────────────
analyzer = ScamAnalyzer()

# ── Redis State Management ─────────────────────────────────────────────────────
redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
try:
    # Use a 1-second connect timeout so we don't hang server startup if Redis isn't there!
    redis_client = redis.from_url(redis_url, socket_connect_timeout=1, decode_responses=True)
    redis_client.ping()
    logging.info("🟢 Redis connected successfully for Rakshak State management.")
except Exception as e:
    redis_client = None
    logging.warning(f"⚠️ Could not connect to Redis: {e}. Falling back to transient memory.")

def _redis_agent_key(username: Optional[str], thread_id: str) -> str:
    """Scope Redis agent keys to a user so sessions can't bleed across accounts."""
    prefix = f"user:{username}:" if username else "anon:"
    return f"agent_state:{prefix}{thread_id}"

def load_agent(thread_id: str, username: Optional[str] = None) -> RakshakAgent:
    if redis_client:
        state = redis_client.get(_redis_agent_key(username, thread_id))
        if state:
            return RakshakAgent.deserialize(state)
    return RakshakAgent(thread_id=thread_id)

def save_agent(thread_id: str, agent: RakshakAgent, username: Optional[str] = None):
    if redis_client:
        redis_client.setex(_redis_agent_key(username, thread_id), 3600, agent.serialize())
