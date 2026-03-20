from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Boolean, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import os
import secrets
import logging

# ── Database URL Resolution ───────────────────────────────────────────────────
# In production (Render), DATABASE_URL is automatically set to the PostgreSQL
# connection string from the managed database defined in render.yaml.
# Locally, it falls back to a SQLite file next to this script.
_db_url = os.environ.get("DATABASE_URL", "")

if not _db_url or _db_url.startswith("sqlite"):
    _db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rakshak_ai.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{_db_file}"
    os.makedirs(os.path.dirname(_db_file), exist_ok=True)
else:
    # Render issues postgres:// but SQLAlchemy 1.4+ requires postgresql://
    SQLALCHEMY_DATABASE_URL = _db_url.replace("postgres://", "postgresql://", 1)

_is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

# For SQLite, we must NOT pass pool_size/max_overflow/pool_timeout 
# as it forces a QueuePool which causes file deadlocks on server restart.
if _is_sqlite:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="operator")
    webauthn_credentials = Column(JSON, default=list)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, index=True)
    scammer_name = Column(String)
    platform = Column(String)
    classification = Column(String)    # e.g., "scam", "safe"
    scam_type = Column(String)         # e.g., "Financial", "Impersonation"
    confidence_score = Column(Float)
    iocs = Column(JSON)
    transcript = Column(Text)
    auto_reported = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # New Phase 16 fields
    is_sealed = Column(Boolean, default=False)
    forensic_signature = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)


class Stats(Base):
    __tablename__ = "stats"

    id = Column(Integer, primary_key=True, index=True)
    total_intercepted = Column(Integer, default=0)
    scams_prevented = Column(Integer, default=0)
    safe_conversations = Column(Integer, default=0)
    current_threat_level = Column(Float, default=0.1)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class WebAuthnChallenge(Base):
    __tablename__ = "webauthn_challenges"

    key = Column(String, primary_key=True)       # e.g. "LOGIN_username" or "REGISTER_username"
    challenge = Column(Text)                      # base64url-encoded challenge bytes
    # Use timezone-aware UTC — datetime.utcnow() is deprecated since Python 3.12
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class RefreshToken(Base):
    """Server-side refresh token store. Allows logout/revocation."""
    __tablename__ = "refresh_tokens"

    token_hash = Column(String, primary_key=True)  # SHA-256 of the raw token
    username = Column(String, index=True)
    expires_at = Column(DateTime(timezone=True))   # 7-day TTL
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DashboardState(Base):
    """Stores the unified intelligence dashboard state for persistent cross-device sync."""
    __tablename__ = "dashboard_states"

    username = Column(String, primary_key=True)
    intelligence_data = Column(JSON)  # Stores the full IntelligenceSummary structure
    threat_coordinates = Column(JSON) # Stores the list of GeoLocation markers
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


def init_db():
    """
    Initializes the database schema and runs Alembic migrations.
    This is called during the application lifespan (server startup).
    """
    logging.info("⚙️ Initializing Database Engine...")
    try:
        # 1. Ensure basic tables exist (Declarative Base)
        Base.metadata.create_all(bind=engine)
        logging.info("✓ [SCHEMA] Base metadata tables verified.")
        
        # 2. Dispose of engine to release any SQLite locks before Alembic takes over
        engine.dispose()
    except Exception as e:
        logging.error(f"❌ Base.metadata.create_all failed: {e}")
    
    # 3. Run Alembic Migrations
    run_migrations()

def run_migrations():
    """
    Programmatically runs 'alembic upgrade head'.
    This ensures the production database is always in sync with the code.
    """
    logging.info("🚀 Running Alembic migrations...")
    try:
        from alembic.config import Config
        from alembic import command
        
        # Locate the alembic.ini relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        ini_path = os.path.join(base_dir, "alembic.ini")
        
        alembic_cfg = Config(ini_path)
        # Point to the versions directory
        alembic_cfg.set_main_option("script_location", os.path.join(base_dir, "alembic"))
        
        # Run the upgrade
        command.upgrade(alembic_cfg, "head")
        logging.info("✅ [MIGRATION] Alembic migrations completed successfully.")
    except Exception as e:
        logging.error(f"❌ [MIGRATION] Alembic migration failed: {e}")
        # In production, we might want to fail fast here, but for now, we just log.
