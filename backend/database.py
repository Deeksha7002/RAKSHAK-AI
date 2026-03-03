from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Boolean, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import os
import secrets

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
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="operator")
    webauthn_credentials = Column(JSON, default=list)  # default=list avoids shared mutable default


class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    scammer_name = Column(String)
    platform = Column(String)
    status = Column(String)
    threat_level = Column(String)
    iocs = Column(JSON)
    transcript = Column(JSON)
    timestamp = Column(String)
    auto_reported = Column(Boolean, default=True)


class Stats(Base):
    __tablename__ = "stats"

    id = Column(Integer, primary_key=True, index=True)
    reports_filed = Column(Integer, default=0)
    scams_detected = Column(Integer, default=0)
    types_json = Column(JSON, default=dict)  # default=dict avoids shared mutable default


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
    Base.metadata.create_all(bind=engine)
