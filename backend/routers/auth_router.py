import os
import json
import logging
import hashlib
from datetime import datetime, timedelta, timezone as tz
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import User, RefreshToken, WebAuthnChallenge
from dependencies import get_db, get_current_user
from schemas import LoginRequest, RefreshRequest
import security

# Biometric Imports
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

router = APIRouter(prefix="/api", tags=["authentication"])
limiter = Limiter(key_func=get_remote_address)

RP_NAME = "Rakshak AI"

# ── Helper for challenge storage ─────────────────────────────────────────────
def store_challenge(db: Session, key: str, challenge_bytes: bytes):
    challenge_str = bytes_to_base64url(challenge_bytes)
    obj = db.query(WebAuthnChallenge).filter(WebAuthnChallenge.key == key).first()
    if obj:
        obj.challenge = challenge_str
        obj.created_at = datetime.now(tz.utc)
    else:
        db.add(WebAuthnChallenge(key=key, challenge=challenge_str))
    db.commit()

def get_challenge(db: Session, key: str) -> Optional[bytes]:
    obj = db.query(WebAuthnChallenge).filter(WebAuthnChallenge.key == key).first()
    if not obj:
        return None
    challenge = base64url_to_bytes(obj.challenge)
    db.delete(obj)
    db.commit()
    return challenge

def get_webauthn_config(request: Request):
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rakshak-ai-drab.vercel.app")
    host = request.headers.get("host", "localhost")
    origin = request.headers.get("origin", FRONTEND_URL)

    if "localhost" in host or "127.0.0.1" in host:
        # Local development: rp_id must be 'localhost'
        rp_id = "localhost"
        # If no origin header (e.g. Swagger test), default to localhost
        if not request.headers.get("origin"):
            origin = "http://localhost:5173"
    else:
        # Production: rp_id MUST come from the Origin header (the browser-facing domain),
        # NOT the Host header (which is the backend Render domain — wrong for WebAuthn).
        # e.g. origin = 'https://rakshak-ai-git-main-deeksha-bansals-projects.vercel.app'
        # → rp_id = 'rakshak-ai-git-main-deeksha-bansals-projects.vercel.app'
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        rp_id = parsed.hostname or host.split(":")[0]

    return {"rp_id": rp_id, "origin": origin}

# ── Standard Auth ────────────────────────────────────────────────────────────

@router.post("/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == creds.username).first()
    if not user:
        # Fallback to users.json for backward compatibility
        try:
            users_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "users.json")
            with open(users_path, "r") as f:
                valid_users = json.load(f)
        except Exception:
            valid_users = {}
        
        if creds.username in valid_users and creds.password == valid_users[creds.username]:
            hashed_pw = security.get_password_hash(creds.password)
            user = User(username=creds.username, hashed_password=hashed_pw, role="admin" if creds.username == "admin" else "operator")
            db.add(user)
            db.commit()
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    if not security.verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = security.create_access_token(data={"sub": user.username, "role": user.role})
    raw_refresh = security.create_refresh_token()
    token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()

    db_refresh = RefreshToken(
        token_hash=token_hash,
        username=user.username,
        expires_at=datetime.now(tz.utc) + timedelta(days=security.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_refresh)
    db.commit()
    return {"status": "success", "token": access_token, "refresh_token": raw_refresh}

@router.post("/register")
def register(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == creds.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Operator ID already exists")

    hashed_pw = security.get_password_hash(creds.password)
    user = User(username=creds.username, hashed_password=hashed_pw, role="operator")
    db.add(user)
    db.commit()

    access_token = security.create_access_token(data={"sub": user.username, "role": user.role})
    raw_refresh = security.create_refresh_token()
    token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
    db_refresh = RefreshToken(
        token_hash=token_hash,
        username=user.username,
        expires_at=datetime.now(tz.utc) + timedelta(days=security.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_refresh)
    db.commit()
    return {"status": "created", "token": access_token, "refresh_token": raw_refresh}

@router.post("/auth/refresh")
def refresh_access_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.refresh_token.encode()).hexdigest()
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    if not stored or stored.revoked:
        raise HTTPException(status_code=401, detail="Invalid or revoked refresh token")
    
    if stored.expires_at.replace(tzinfo=tz.utc) < datetime.now(tz.utc):
        raise HTTPException(status_code=401, detail="Refresh token has expired")

    user = db.query(User).filter(User.username == stored.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = security.create_access_token(data={"sub": user.username, "role": user.role})
    return {"token": new_access}

@router.post("/auth/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.refresh_token.encode()).hexdigest()
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored:
        stored.revoked = True
        db.commit()
    return {"status": "logged_out"}

# ── Biometric Auth Routes ────────────────────────────────────────────────────

@router.post("/auth/biometric/register/start")
def register_bio_start(username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    config = get_webauthn_config(request)
    options = generate_registration_options(
        rp_id=config["rp_id"],
        rp_name=RP_NAME,
        user_id=username.encode(),
        user_name=username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
        attestation=AttestationConveyancePreference.NONE,
    )
    store_challenge(db, "REGISTER_" + username, options.challenge)
    return options_to_json(options)

@router.post("/auth/biometric/register/finish")
def register_bio_finish(response: Dict[str, Any], username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    challenge = get_challenge(db, "REGISTER_" + username)
    if not challenge:
        raise HTTPException(status_code=400, detail="No active registration challenge")

    config = get_webauthn_config(request)
    try:
        verification = verify_registration_response(
            credential=RegistrationCredential.parse_obj(response),
            expected_challenge=challenge,
            expected_origin=config["origin"],
            expected_rp_id=config["rp_id"],
        )
        # Store credential
        cred_data = {
            "credential_id": bytes_to_base64url(verification.credential_id),
            "public_key": bytes_to_base64url(verification.public_key),
            "sign_count": verification.sign_count,
        }
        credentials = list(user.webauthn_credentials)
        credentials.append(cred_data)
        user.webauthn_credentials = credentials
        db.commit()
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Biometric registration failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/biometric/login/start")
def login_bio_start(username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.webauthn_credentials:
        raise HTTPException(status_code=400, detail="User has no biometric credentials")

    config = get_webauthn_config(request)
    options = generate_authentication_options(
        rp_id=config["rp_id"],
        allow_credentials=[
            AuthenticationCredential(id=base64url_to_bytes(c["credential_id"]))
            for c in user.webauthn_credentials
        ],
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    store_challenge(db, "LOGIN_" + username, options.challenge)
    return options_to_json(options)

@router.post("/auth/biometric/login/finish")
def login_bio_finish(response: Dict[str, Any], username: str, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    challenge = get_challenge(db, "LOGIN_" + username)
    if not challenge:
        raise HTTPException(status_code=400, detail="No active login challenge")

    config = get_webauthn_config(request)
    try:
        credential_id = response.get("id")
        cred_stored = next((c for c in user.webauthn_credentials if c["credential_id"] == credential_id), None)
        if not cred_stored:
            raise HTTPException(status_code=400, detail="Credential not found")

        verification = verify_authentication_response(
            credential=AuthenticationCredential.parse_obj(response),
            expected_challenge=challenge,
            expected_origin=config["origin"],
            expected_rp_id=config["rp_id"],
            credential_public_key=base64url_to_bytes(cred_stored["public_key"]),
            credential_current_sign_count=cred_stored["sign_count"],
        )
        
        # Update sign count
        credentials = list(user.webauthn_credentials)
        for c in credentials:
            if c["credential_id"] == credential_id:
                c["sign_count"] = verification.new_sign_count
        user.webauthn_credentials = credentials
        db.commit()

        access_token = security.create_access_token(data={"sub": user.username, "role": user.role})
        return {"status": "success", "token": access_token}
    except Exception as e:
        logging.error(f"Biometric login failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
