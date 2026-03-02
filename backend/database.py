from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Boolean, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

# Determine database URL - always use a path we can write to
_db_url = os.environ.get("DATABASE_URL", "")

if not _db_url or _db_url.startswith("sqlite"):
    # Use a path inside the working directory (always writable in Docker)
    _db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rakshak_ai.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{_db_file}"
    # Ensure parent directory exists
    os.makedirs(os.path.dirname(_db_file), exist_ok=True)
else:
    # Render gives postgres:// but SQLAlchemy needs postgresql://
    SQLALCHEMY_DATABASE_URL = _db_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="operator")
    webauthn_credentials = Column(JSON, default=[]) # Store list of registered credentials

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
    types_json = Column(JSON, default={}) # Store scam types count as JSON

class WebAuthnChallenge(Base):
    __tablename__ = "webauthn_challenges"

    key = Column(String, primary_key=True)  # e.g. "LOGIN_username" or "REGISTER_username"
    challenge = Column(Text)  # base64url encoded challenge bytes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
