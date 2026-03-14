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

# pool_pre_ping ensures stale connections are recycled (important for PostgreSQL)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=not _is_sqlite,   # no-op for SQLite; keeps PG connections alive
    pool_size=5 if not _is_sqlite else 5,
    max_overflow=10 if not _is_sqlite else 10,
    pool_timeout=30 if not _is_sqlite else 30,
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


def init_db():
    logging.info("🛠️ Initializing database and ensuring schema consistency...")
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logging.error(f"❌ Base.metadata.create_all failed: {e}")
    
    # ── Safe Auto-Migration ───────────────────────────────────────────────────
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    
    # 1. Users Table Schema Integrity
    try:
        columns = [c["name"] for c in inspector.get_columns("users")]
        # Ensure webauthn_credentials exists
        if "webauthn_credentials" not in columns:
            logging.warning("🚨 [MIGRATION] 'webauthn_credentials' missing from 'users' table.")
            with engine.begin() as conn:
                if _is_sqlite:
                    conn.execute(text("ALTER TABLE users ADD COLUMN webauthn_credentials JSON DEFAULT '[]'"))
                else:
                    conn.execute(text("ALTER TABLE users ADD COLUMN webauthn_credentials JSONB DEFAULT '[]'::jsonb"))
            logging.info("✅ [MIGRATION] 'webauthn_credentials' column added.")
        
        # Ensure 'role' column exists
        if "role" not in columns:
            logging.warning("🚨 [MIGRATION] 'role' column missing from 'users' table.")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'operator'"))
            logging.info("✅ [MIGRATION] 'role' column added.")

        # Ensure 'last_login_at' column exists (found via diagnostic)
        if "last_login_at" not in columns:
            logging.warning("🚨 [MIGRATION] 'last_login_at' column missing from 'users' table.")
            with engine.begin() as conn:
                # Use TIMESTAMP WITH TIME ZONE for Postgres compatibility
                col_type = "DATETIME" if _is_sqlite else "TIMESTAMP WITH TIME ZONE"
                conn.execute(text(f"ALTER TABLE users ADD COLUMN last_login_at {col_type}"))
            logging.info("✅ [MIGRATION] 'last_login_at' column added.")

        logging.info("✓ [SCHEMA] 'users' table columns verified.")
    except Exception as e:
        logging.error(f"❌ [MIGRATION] Users schema check failed: {e}")

    # 2. Refresh Tokens Table
    try:
        if "refresh_tokens" not in inspector.get_table_names():
            logging.warning("🚨 [MIGRATION] 'refresh_tokens' table missing.")
            with engine.begin() as conn:
                if _is_sqlite:
                    conn.execute(text("""
                        CREATE TABLE refresh_tokens (
                            token_hash TEXT PRIMARY KEY,
                            username TEXT,
                            expires_at DATETIME,
                            revoked BOOLEAN DEFAULT 0,
                            created_at DATETIME
                        )
                    """))
                else:
                    conn.execute(text("""
                        CREATE TABLE refresh_tokens (
                            token_hash VARCHAR PRIMARY KEY,
                            username VARCHAR,
                            expires_at TIMESTAMP WITH TIME ZONE,
                            revoked BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP WITH TIME ZONE
                        )
                    """))
            logging.info("✅ [MIGRATION] 'refresh_tokens' table created.")
        else:
            logging.info("✓ [SCHEMA] 'refresh_tokens' table verified.")
    except Exception as e:
        logging.error(f"❌ [MIGRATION] Refresh tokens check failed: {e}")

    # 3. Cases Table
    try:
        columns = [c["name"] for c in inspector.get_columns("cases")]
        new_cols = []
        if "scam_type" not in columns: new_cols.append("scam_type TEXT")
        if "transcript" not in columns: new_cols.append("transcript TEXT")
        if "auto_reported" not in columns: 
            new_cols.append("auto_reported BOOLEAN DEFAULT 1" if _is_sqlite else "auto_reported BOOLEAN DEFAULT TRUE")
        
        if new_cols:
            logging.warning(f"🚨 [MIGRATION] Cases table missing columns: {new_cols}")
            with engine.begin() as conn:
                for col_def in new_cols:
                    conn.execute(text(f"ALTER TABLE cases ADD COLUMN {col_def}"))
            logging.info("✅ [MIGRATION] Cases table schema updated.")
        else:
            logging.info("✓ [SCHEMA] 'cases' table columns verified.")
    except Exception as e:
        logging.error(f"❌ [MIGRATION] Case table check failed: {e}")
