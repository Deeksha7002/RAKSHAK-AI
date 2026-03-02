from fastapi import FastAPI, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import logging
import time
import json
import os
import redis
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import sys

# Ensure the backend directory is in the path for internal imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Internal Modules
from analyzer import ScamAnalyzer
from agent import HoneypotAgent
from database import SessionLocal, engine, init_db, User, Case, Stats, WebAuthnChallenge
import security

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [API] - %(message)s')

# Initialize DB tables
init_db()

app = FastAPI(title="Honeypot Cyber Cell API")

# Enable CORS for frontend
ALLOWED_ORIGINS = [
    os.environ.get("FRONTEND_URL", "https://rakshak-ai-drab.vercel.app"),
    "https://rakshak-ai-drab.vercel.app",
    "https://scam-defender-honeypot.vercel.app",
    "https://honeypot-gamma.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Rakshak-Token"],
)

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enterprise Security Middleware
@app.middleware("http")
async def secure_headers_and_obfuscation(request: Request, call_next):
    # Dead-Drop API Obfuscation (only for /api/ routes)
    if request.url.path.startswith("/api/"):
        token = request.headers.get("X-Rakshak-Token")
        if token != "rakshak-core-v1" and request.method != "OPTIONS":
            return JSONResponse(status_code=403, content={"detail": "Access Denied: Missing or Invalid Rakshak Security Token"})

    response = await call_next(request)
    
    # Vault Door Security Headers
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    
    return response

# Initialize Core Logic
analyzer = ScamAnalyzer()

# Redis State Management Setup
redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
try:
    # Use a 1-second connect timeout so we don't hang server startup if Redis isn't there!
    redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1)
    redis_client.ping()
    logging.info("🟢 Redis connected successfully for Agent State management.")
except Exception as e:
    redis_client = None
    logging.warning(f"⚠️ Could not connect to Redis: {e}. Falling back to transient memory.")

def load_agent(thread_id: str) -> HoneypotAgent:
    if redis_client:
        state_str = redis_client.get(f"agent_state:{thread_id}")
        if state_str:
            return HoneypotAgent(state_dict=json.loads(state_str))
    return HoneypotAgent()

def save_agent(thread_id: str, agent: HoneypotAgent):
    if redis_client:
        state = agent.get_state()
        redis_client.setex(f"agent_state:{thread_id}", 86400, json.dumps(state)) # 24 hour TTL

# WebSockets Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logging.error(f"Failed to broadcast to a connection: {e}")

manager = ConnectionManager()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Data Models ---
class AnalysisRequest(BaseModel):
    text: str
    context: Optional[str] = "general"

class ReportRequest(BaseModel):
    conversationId: str
    scammerName: Optional[str] = "Unknown"
    platform: Optional[str] = "chat"
    classification: str
    confidenceScore: float
    transcript: List[Dict[str, Any]]
    iocs: Dict[str, Any]
    timestamp: str

class LoginRequest(BaseModel):
    username: str
    password: str

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "active", "system": "Cyber Cell Core", "version": "2.0.0 (Fortified)"}

@app.post("/api/analyze")
@limiter.limit("20/minute")
def analyze_text(payload: AnalysisRequest, request: Request):
    """
    Performs deep heuristic analysis on a text snippet with robust NLTK fallback.
    """
    import re
    import traceback
    
    start_time = time.time()
    classification = "benign"
    intent = "GENERAL INQUIRY"
    score = 0.1
    iocs = []
    neuro_matrix = {}
    
    # Very basic regex for URLs/domains/phones/crypto (always runs)
    req_text = payload.text
    urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', req_text)
    domains = re.findall(r'[a-zA-Z0-9-]+\.(?:com|net|org|io|biz|info)', req_text)
    
    iocs.extend(urls)
    for d in domains:
        if not any(d in u for u in urls):
            iocs.append(d)
            
    phones = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', req_text)
    iocs.extend(phones)
    
    crypto = re.findall(r'\b(?:1|3|bc1|0x)[a-zA-Z0-9]{25,40}\b', req_text)
    iocs.extend(crypto)
    
    try:
        from backend.analyzer import ScamAnalyzer
        import nltk
        
        # Best effort corpora download, skip if it fails
        corpora = ['punkt_tab', 'averaged_perceptron_tagger', 'brown', 'wordnet']
        for c in corpora:
            try:
                nltk.data.find(f'tokenizers/{c}' if 'punkt' in c else f'corpora/{c}')
            except LookupError:
                try:
                    nltk.download(c, quiet=True)
                except Exception:
                    pass
        
        # Reusing the globally instantiated analyzer for performance
        # analyzer is defined globally in server.py
        history = [{"role": "scammer", "content": req_text}]
        score, classification, neuro_matrix = analyzer.analyze_behavior(history)
        intent = analyzer.intent.replace("_", " ")
        
    except Exception as e:
        logging.error(f"NLP Analyzer failed, falling back to basic heuristics: {e}")
        traceback.print_exc()
        
        # Fallback Heuristics
        lower_text = req_text.lower()
        if any(w in lower_text for w in ["password", "otp", "code", "wallet", "crypto", "arrest", "warrant", "urgent"]):
            classification = "scam"
            intent = "SUSPICIOUS ACTIVITY"
            score = 0.85
        if any(w in lower_text for w in ["click here", "verify your"]):
            classification = "scam"
            intent = "MALICIOUS PHISHING"
            score = 0.95
        if urls or crypto:
            classification = "scam"
            
    # Simulate processing delay for "Deep Scan" effect
    time.sleep(0.5) 
    
    return {
        "classification": classification,
        "score": score,
        "intent": intent,
        "iocs": list(set(iocs)),
        "neuro_matrix": neuro_matrix,
        "processing_time": time.time() - start_time,
        "verified": True
    }


# --- Stats Management ---
def get_or_create_stats(db: Session):
    stats = db.query(Stats).first()
    if not stats:
        stats = Stats(reports_filed=0, scams_detected=0, types_json={})
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

@app.get("/api/stats")
@limiter.limit("30/minute")
def get_stats(request: Request, db: Session = Depends(get_db)):
    # Calculate time-based stats dynamically from Cases
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # helper to filter and count + breakdown + unique scammers
    def get_stats_for_range(time_threshold):
        cases = db.query(Case).all()
        count = 0
        breakdown = {t: 0 for t in ["ROMANCE", "CRYPTO", "JOB", "IMPERSONATION", "LOTTERY", "TECHNICAL_SUPPORT", "AUTHORITY", "OTHER"]}
        scammers = set()
        
        for c in cases:
            try:
                # Handle ISO format Z (trailing Z)
                ts_str = c.timestamp.replace('Z', '+00:00')
                c_time = datetime.fromisoformat(ts_str)
                
                # Ensure c_time is aware if it's not
                if c_time.tzinfo is None:
                    c_time = c_time.replace(tzinfo=timezone.utc)
                
                if c_time > time_threshold:
                    count += 1
                    ctype = c.threat_level.upper() if c.threat_level else "OTHER"
                    if ctype in breakdown:
                        breakdown[ctype] += 1
                    else:
                        breakdown["OTHER"] += 1
                    
                    if c.scammer_name:
                        scammers.add(c.scammer_name)
            except Exception as e:
                logging.error(f"Error parsing timestamp {c.timestamp}: {e}")
                pass 
        return count, breakdown, len(scammers)

    t_count, t_types, t_scammers = get_stats_for_range(day_ago)
    w_count, w_types, w_scammers = get_stats_for_range(week_ago)
    m_count, m_types, m_scammers = get_stats_for_range(month_ago)
    
    stats = get_or_create_stats(db)
    
    return {
        "reports_filed": stats.reports_filed,
        "scams_detected": stats.scams_detected,
        "types": stats.types_json,
        "today": t_count,
        "week": w_count,
        "month": m_count,
        "today_types": t_types,
        "week_types": w_types,
        "month_types": m_types,
        "today_scammers": t_scammers,
        "week_scammers": w_scammers,
        "month_scammers": m_scammers
    }

# --- Cases Management ---

@app.get("/api/cases")
@limiter.limit("20/minute")
def get_cases(request: Request, db: Session = Depends(get_db)):
    cases = db.query(Case).all()
    # Convert to list of dicts for JSON response
    return [{
        "id": c.id,
        "scammerName": c.scammer_name,
        "platform": c.platform,
        "status": c.status,
        "threatLevel": c.threat_level,
        "iocs": c.iocs,
        "transcript": c.transcript,
        "timestamp": c.timestamp,
        "autoReported": c.auto_reported
    } for c in cases]

@app.post("/api/report")
@limiter.limit("10/minute")
def submit_report(report: ReportRequest, request: Request, db: Session = Depends(get_db)):
    """
    Receives official scam reports from the frontend honeypot.
    """
    logging.info(f"🚨 [REPORT RECEIVED] ID: {report.conversationId} | Type: {report.classification}")
    
    # Update Stats
    stats = get_or_create_stats(db)
    stats.reports_filed += 1
    stats.scams_detected += 1 # Increment detected counter
    
    scam_type = report.classification.upper()
    current_types = dict(stats.types_json) # Copy to modify
    current_types[scam_type] = current_types.get(scam_type, 0) + 1
    stats.types_json = current_types # Reassign to trigger update
    
    # Save Case
    existing_case = db.query(Case).filter(Case.id == report.conversationId).first()
    if not existing_case:
        new_case = Case(
            id=report.conversationId,
            scammer_name=report.scammerName,
            platform=report.platform,
            status="closed",
            threat_level=report.classification,
            iocs=report.iocs,
            transcript=report.transcript,
            timestamp=report.timestamp,
            auto_reported=True
        )
        db.add(new_case)
    
    db.commit()
    
    return {"status": "received", "case_id": f"CASE-{int(time.time())}"}

# --- Authentication ---

@app.post("/api/login")
@limiter.limit("5/minute")
def login(creds: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == creds.username).first()
    
    # If user doesn't exist in DB, look them up in users.json to auto-create
    if not user:
        try:
            users_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.json")
            with open(users_path, "r") as f:
                valid_users = json.load(f)
        except Exception as e:
            logging.error(f"Could not load users.json: {e}")
            valid_users = {"admin": "password123"}
            
        if creds.username in valid_users and creds.password == valid_users[creds.username]:
            hashed_pw = security.get_password_hash(creds.password)
            role = "admin" if creds.username == "admin" else "operator"
            new_user = User(username=creds.username, hashed_password=hashed_pw, role=role)
            db.add(new_user)
            db.commit()
            user = new_user
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not security.verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = security.create_access_token(data={"sub": user.username, "role": user.role})
    return {"status": "success", "token": access_token}

@app.post("/api/register")
@limiter.limit("5/minute")
def register(creds: LoginRequest, request: Request, db: Session = Depends(get_db)):
    logging.info(f"--- REGISTRATION ATTEMPT: {creds.username} ---")
    user = db.query(User).filter(User.username == creds.username).first()
    if user:
        logging.warning(f"Registration Blocked: {creds.username} already exists in DB.")
        raise HTTPException(status_code=400, detail="Operator ID already exists")
    
    try:
        hashed_pw = security.get_password_hash(creds.password)
        new_user = User(username=creds.username, hashed_password=hashed_pw, role="operator")
        db.add(new_user)
        db.commit()
        
        access_token = security.create_access_token(data={"sub": new_user.username, "role": new_user.role})
        return {"status": "created", "token": access_token}
    except Exception as e:
        logging.error(f"Registration Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Biometric Auth (WebAuthn) ---
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers import bytes_to_base64url, base64url_to_bytes, options_to_json
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    AuthenticatorAttachment,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    RegistrationCredential,
    AuthenticationCredential,
    AuthenticatorAttestationResponse,
    AuthenticatorAssertionResponse,
)

# Helper to get the current RP ID and Origin from the request
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rakshak-ai-drab.vercel.app")

def get_webauthn_config(request: Request):
    from urllib.parse import urlparse
    origin_header = request.headers.get("origin", "")
    
    if origin_header:
        parsed = urlparse(origin_header)
        hostname = parsed.hostname or "localhost"
        # Ensure we only allow origins that are in our ALLOWED_ORIGINS list
        if origin_header in ALLOWED_ORIGINS or "localhost" in hostname or "127.0.0.1" in hostname:
            return hostname, origin_header
    
    # Fallback to default if no origin header or not allowed
    parsed = urlparse(FRONTEND_URL)
    return parsed.hostname or "localhost", f"{parsed.scheme}://{parsed.hostname}"

RP_NAME = "Rakshak AI"

# Database-backed challenge store (survives server restarts)
def store_challenge(db: Session, key: str, challenge_bytes: bytes):
    """Store a WebAuthn challenge in the database."""
    existing = db.query(WebAuthnChallenge).filter(WebAuthnChallenge.key == key).first()
    challenge_b64 = bytes_to_base64url(challenge_bytes)
    if existing:
        existing.challenge = challenge_b64
    else:
        db.add(WebAuthnChallenge(key=key, challenge=challenge_b64))
    db.commit()

def get_challenge(db: Session, key: str) -> bytes:
    """Retrieve and delete a WebAuthn challenge from the database."""
    record = db.query(WebAuthnChallenge).filter(WebAuthnChallenge.key == key).first()
    if not record:
        return None
    challenge = base64url_to_bytes(record.challenge)
    db.delete(record)
    db.commit()
    return challenge

@app.post("/api/auth/biometric/register/start")
@limiter.limit("30/minute")
def register_bio_start(username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    rp_id, origin = get_webauthn_config(request)
    options = generate_registration_options(
        rp_id=rp_id,
        rp_name=RP_NAME,
        user_id=str(user.id).encode(),
        user_name=user.username,
        user_display_name=user.username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            user_verification=UserVerificationRequirement.PREFERRED,
            resident_key=ResidentKeyRequirement.PREFERRED,
        ),
        attestation=AttestationConveyancePreference.NONE,
    )

    store_challenge(db, user.username, options.challenge)
    return json.loads(options_to_json(options))

@app.post("/api/auth/biometric/register/finish")
@limiter.limit("30/minute")
def register_bio_finish(response: Dict[str, Any], username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    challenge = get_challenge(db, user.username)
    if not challenge:
        raise HTTPException(status_code=400, detail="No active registration challenge found")

    try:
        att_response = response.get("response", {})
        credential = RegistrationCredential(
            id=response["id"],
            raw_id=base64url_to_bytes(response["rawId"]),
            response=AuthenticatorAttestationResponse(
                client_data_json=base64url_to_bytes(att_response["clientDataJSON"]),
                attestation_object=base64url_to_bytes(att_response["attestationObject"]),
            ),
            type=response.get("type", "public-key"),
        )

        rp_id, origin = get_webauthn_config(request)
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=challenge,
            expected_origin=origin,
            expected_rp_id=rp_id,
            require_user_verification=False,
        )

        new_cred = {
            "credential_id": bytes_to_base64url(verification.credential_id),
            "credential_public_key": bytes_to_base64url(verification.credential_public_key),
            "sign_count": verification.sign_count,
        }

        creds = list(user.webauthn_credentials) if user.webauthn_credentials else []
        creds.append(new_cred)
        user.webauthn_credentials = creds
        db.commit()
        return {"status": "registered"}

    except Exception as e:
        logging.error(f"Biometric registration failed: {e}")
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/biometric/login/start")
@limiter.limit("30/minute")
def login_bio_start(username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.webauthn_credentials:
        raise HTTPException(status_code=400, detail="No biometric registered for this account")

    from webauthn.helpers.structs import PublicKeyCredentialDescriptor
    allow_credentials = []
    for cred in (user.webauthn_credentials or []):
        try:
            allow_credentials.append(
                PublicKeyCredentialDescriptor(id=base64url_to_bytes(cred["credential_id"]))
            )
        except Exception:
            pass

    rp_id, origin = get_webauthn_config(request)
    options = generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.PREFERRED,
    )

    store_challenge(db, "LOGIN_" + username, options.challenge)
    return json.loads(options_to_json(options))

@app.post("/api/auth/biometric/login/finish")
@limiter.limit("30/minute")
def login_bio_finish(response: Dict[str, Any], username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    challenge = get_challenge(db, "LOGIN_" + username)
    if not challenge:
        raise HTTPException(status_code=400, detail="No active login challenge found")

    cred_id = response.get("id")
    matched_cred = None
    for c in (user.webauthn_credentials or []):
        if c.get("credential_id") == cred_id:
            matched_cred = c
            break

    if not matched_cred:
        raise HTTPException(status_code=400, detail="Credential not registered on this account")

    try:
        rp_id, origin = get_webauthn_config(request)

        ass_response = response.get("response", {})
        credential = AuthenticationCredential(
            id=response["id"],
            raw_id=base64url_to_bytes(response["rawId"]),
            response=AuthenticatorAssertionResponse(
                client_data_json=base64url_to_bytes(ass_response["clientDataJSON"]),
                authenticator_data=base64url_to_bytes(ass_response["authenticatorData"]),
                signature=base64url_to_bytes(ass_response["signature"]),
                user_handle=base64url_to_bytes(ass_response["userHandle"]) if ass_response.get("userHandle") else None,
            ),
            type=response.get("type", "public-key"),
        )

        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_origin=origin,
            expected_rp_id=rp_id,
            credential_public_key=base64url_to_bytes(matched_cred["credential_public_key"]),
            credential_current_sign_count=matched_cred["sign_count"],
            require_user_verification=False,
        )

        matched_cred["sign_count"] = verification.new_sign_count
        user.webauthn_credentials = list(user.webauthn_credentials)
        db.commit()

        access_token = security.create_access_token(data={"sub": user.username, "role": user.role})
        return {"status": "success", "token": access_token}

    except Exception as e:
        logging.error(f"Biometric login failed: {e}")
        raise HTTPException(status_code=400, detail=f"Biometric auth failed: {str(e)}")

# --- Discoverable / Username-less Biometric Login (auto-prompt on page load) ---
DISCOVER_CHALLENGE_KEY = "__DISCOVER__"

@app.post("/api/auth/biometric/discover/start")
def discover_bio_start(request: Request, db: Session = Depends(get_db)):
    """Generate a challenge with no allow_credentials — browser will offer all saved passkeys."""
    rp_id, origin = get_webauthn_config(request)
    options = generate_authentication_options(
        rp_id=rp_id,
        allow_credentials=[],   # empty = discoverable / resident key
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    store_challenge(db, DISCOVER_CHALLENGE_KEY, options.challenge)
    return json.loads(options_to_json(options))

@app.post("/api/auth/biometric/discover/finish")
def discover_bio_finish(response: Dict[str, Any], request: Request, db: Session = Depends(get_db)):
    """Verify the assertion and identify the user via userHandle."""
    challenge = get_challenge(db, DISCOVER_CHALLENGE_KEY)
    if not challenge:
        raise HTTPException(status_code=400, detail="No active discovery challenge")

    # Decode userHandle to get user ID
    user_handle_b64 = response.get("response", {}).get("userHandle")
    if not user_handle_b64:
        raise HTTPException(status_code=400, detail="No userHandle in assertion — use normal login")

    try:
        user_id_bytes = base64url_to_bytes(user_handle_b64)
        user_id = int(user_id_bytes.decode())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid userHandle")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found from userHandle")

    cred_id = response.get("id")
    matched_cred = None
    for c in (user.webauthn_credentials or []):
        if c.get("credential_id") == cred_id:
            matched_cred = c
            break

    if not matched_cred:
        raise HTTPException(status_code=400, detail="Credential not registered on this account")

    try:
        rp_id, origin = get_webauthn_config(request)

        ass_response = response.get("response", {})
        credential = AuthenticationCredential(
            id=response["id"],
            raw_id=base64url_to_bytes(response["rawId"]),
            response=AuthenticatorAssertionResponse(
                client_data_json=base64url_to_bytes(ass_response["clientDataJSON"]),
                authenticator_data=base64url_to_bytes(ass_response["authenticatorData"]),
                signature=base64url_to_bytes(ass_response["signature"]),
                user_handle=base64url_to_bytes(ass_response["userHandle"]) if ass_response.get("userHandle") else None,
            ),
            type=response.get("type", "public-key"),
        )

        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=challenge,
            expected_origin=origin,
            expected_rp_id=rp_id,
            credential_public_key=base64url_to_bytes(matched_cred["credential_public_key"]),
            credential_current_sign_count=matched_cred["sign_count"],
            require_user_verification=False,
        )

        matched_cred["sign_count"] = verification.new_sign_count
        user.webauthn_credentials = list(user.webauthn_credentials)
        db.commit()

        access_token = security.create_access_token(data={"sub": user.username, "role": user.role})
        return {"status": "success", "token": access_token, "username": user.username}

    except Exception as e:
        logging.error(f"Discoverable biometric login failed: {e}")
        raise HTTPException(status_code=400, detail=f"Biometric auth failed: {str(e)}")

from pydantic import BaseModel
class AnalyzeRequest(BaseModel):
    text: str

# --- Real-World Integration (Twilio Webhook) ---
from fastapi import Form
from fastapi.responses import PlainTextResponse

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/webhook/twilio")
async def twilio_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Receives real SMS messages from Twilio.
    1. Sends the text to the NLP Analyzer.
    2. Generates a Honeypot response.
    3. Returns TwiML for Twilio to send the SMS back to the scammer.
    """
    logging.info(f"📱 [TWILIO WEBHOOK] Received SMS from {From}: {Body}")
    
    # In a full production system, you would look up the persistent HoneypotAgent
    # for this specific phone number (From) in memory or a fast cache like Redis.
    temp_agent = load_agent(From)
    
    # 1. Analyze and ingest the incoming text
    analysis = temp_agent.ingest(text=Body, thread_id=From)
    
    # 2. Update global stats (simulating that the honeypot caught something)
    if analysis["classification"] in ["scam", "likely_scam"]:
        stats = get_or_create_stats(db)
        stats.reports_filed += 1
        current_types = dict(stats.types_json)
        scam_type = analysis.get("scamType", "OTHER").upper()
        current_types[scam_type] = current_types.get(scam_type, 0) + 1
        stats.types_json = current_types
        db.commit()

    # 3. Generate the response
    response_text = temp_agent.generateResponse(
        classification=analysis["classification"],
        text=Body
    )
    
    if not response_text:
        response_text = "I'm sorry, who is this?"

    logging.info(f"🤖 [HONEYPOT REPLY]: {response_text}")

    # Save state back to Redis
    save_agent(From, temp_agent)

    # Broadcast to connected frontends
    await manager.broadcast(json.dumps({
        "type": "NEW_INTERCEPT",
        "threadId": From,
        "scammerText": Body,
        "agentReply": response_text,
        "classification": analysis["classification"],
        "intent": analysis.get("intent", "UNKNOWN"),
        "timestamp": int(time.time() * 1000)
    }))

    # 4. Return standard TwiML format for Twilio to reply
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{response_text}</Message>
</Response>"""

    return PlainTextResponse(content=twiml_response, media_type="application/xml")

@app.post("/api/webhook/email")
async def email_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives real incoming emails from SendGrid Inbound Parse.
    1. Parses the multipart/form-data payload.
    2. Extracts the plain text body and sender address.
    3. Analyzes it and broadcasts to the frontend.
    """
    try:
        # SendGrid sends data as multipart/form-data
        form_data = await request.form()
        
        # Extract fields
        sender = form_data.get("from", "Unknown Sender")
        subject = form_data.get("subject", "No Subject")
        text_body = form_data.get("text", "")
        
        logging.info(f"📧 [EMAIL WEBHOOK] Received Email from {sender}. Subject: {subject}")
        
        # Clean the sender email if it comes in format "Name <email@domain.com>"
        import re
        email_match = re.search(r'<([^>]+)>', sender)
        clean_sender = email_match.group(1) if email_match else sender

        temp_agent = load_agent(clean_sender)
        
        # 1. Analyze the text payload
        # Combine subject and body for analysis
        full_text = f"Subject: {subject}\n\n{text_body}"
        analysis = temp_agent.ingest(text=full_text, thread_id=clean_sender)
        
        # 2. Update stats 
        if analysis["classification"] in ["scam", "likely_scam"]:
            stats = get_or_create_stats(db)
            stats.reports_filed += 1
            current_types = dict(stats.types_json)
            scam_type = analysis.get("scamType", "OTHER").upper()
            current_types[scam_type] = current_types.get(scam_type, 0) + 1
            stats.types_json = current_types
            db.commit()

        # 3. Generate response
        response_text = temp_agent.generateResponse(
            classification=analysis["classification"],
            text=full_text
        )
        if not response_text:
            response_text = "I received your email but I am not sure what you mean."

        logging.info(f"🤖 [HONEYPOT EMAIL REPLY]: {response_text}")

        # Save state back to Redis
        save_agent(clean_sender, temp_agent)

        # 4. Broadcast to frontend
        await manager.broadcast(json.dumps({
            "type": "NEW_INTERCEPT",
            "threadId": clean_sender,
            "scammerText": full_text[:500] + ("..." if len(full_text) > 500 else ""), # Truncate massive emails for UI
            "agentReply": response_text,
            "classification": analysis["classification"],
            "intent": analysis.get("intent", "UNKNOWN"),
            "timestamp": int(time.time() * 1000)
        }))

        # (In reality, here is where you would call the SendGrid API to dispatch the email reply)
        # return JSONResponse(status_code=200, content={"message": "Email Processed"})

        return JSONResponse(status_code=200, content={"status": "received"})
        
    except Exception as e:
        logging.error(f"❌ [EMAIL WEBHOOK ERROR] {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
