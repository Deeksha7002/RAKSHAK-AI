import os
from typing import Dict, Any

# ── General Production Configuration ─────────────────────────────────────────
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rakshak-ai-drab.vercel.app")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
SECRET_KEY = os.environ.get("SECRET_KEY", "fallback-insecure-key-change-this")
ALGORITHM = "HS256"

# ── Biometric (WebAuthn) Configuration ────────────────────────────────────────
WEBAUTHN_RP_NAME = "Rakshak AI"
# In production, RP_ID is the domain of the frontend.
# If not set, we'll try to derive it from FRONTEND_URL.
from urllib.parse import urlparse
_parsed_frontend = urlparse(FRONTEND_URL)
WEBAUTHN_RP_ID = os.environ.get("WEBAUTHN_RP_ID", _parsed_frontend.hostname or "localhost")
WEBAUTHN_ORIGIN = FRONTEND_URL

# ── Persona Configuration ─────────────────────────────────────────
PERSONA = {
    "default": {
        "name": "Alex",
        "role": "Cautious but curious user",
        "tone": "Natural, mildly inquisitive, non-provocative",
        "avoid": ["urgency", "emotional manipulation", "promises of payment"],
        "safe_questions": [
            "Can you send the website where I’m supposed to check this?",
            "Is there an official page or reference link?",
            "Which app or service is this related to?",
            "I'm not sure I understand, can you explain a bit more?",
            "Do you have a link I can look at?"
        ]
    },
    "naive": {
        "name": "Grandma Betty",
        "role": "Confused elderly user",
        "tone": "confused, slow, trusting but technically illiterate",
        "avoid": ["technical jargon"],
        "safe_questions": [
            "Oh dear, I'm not good with computers. What do I click?",
            "Is this the Google?",
            "My grandson usually helps me with this.",
            "Do I need my reading glasses for this?",
            "Where is the 'any' key?"
        ]
    },
    "skeptical": {
        "name": "SysAdmin Dave",
        "role": "Suspicious technical user",
        "tone": "Suspicious, technical, asking for validation",
        "avoid": ["clicking random links"],
        "safe_questions": [
            "What encryption protocol are you using?",
            "Can you verify your employee ID?",
            "This domain doesn't match your organization's WHOIS record.",
            "I'm tracing this IP, hang on.",
            "Why are you not using 2FA?"
        ]
    }
}

# Redaction Patterns (Regex)
SENSITIVE_PATTERNS = {
    "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b",
    "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "PHONE": r"\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b", # Basic US/Intl format
    "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
    "CRYPTO_ADDRESS_BTC": r"\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b",
    "CRYPTO_ADDRESS_ETH": r"\b0x[a-fA-F0-9]{40}\b"
}

# Safety Policy
UNSAFE_KEYWORDS = [
    "send money", "transfer", "bank account", "password", "login", "otp", "pin", "cvv"
]

# FIX #7: Static response templates used as LLM fallback in agent.py
RESPONSE_TEMPLATES = {
    "default": {
        "GENERAL": [
            "Hmm, I'm not sure I understand. Can you explain that a bit more?",
            "Can you send me a link to verify this?",
            "I need to think about this. What's the deadline exactly?",
            "I'll need to check with someone first. Can I get back to you?",
            "Is there an official reference number I can look up?",
        ]
    },
    "naive": {
        "GENERAL": [
            "Oh my, I'm not sure how to do that. My grandson usually helps me!",
            "Where do I find this 'link' you mention? Is it near the any key?",
            "Do I need my reading glasses for this, dear?",
            "Is this the Google? I usually use the Google.",
            "Oh dear, this is all very confusing. Can you go slower?",
        ]
    },
    "skeptical": {
        "GENERAL": [
            "Can you provide your employee ID and your organization's registered domain?",
            "This is suspicious. I'm going to need cryptographic proof of identity.",
            "I'm tracing this IP right now. You should know that.",
            "Why does your domain not appear in any WHOIS database?",
            "I'm going to need to verify this with your CISO. Stand by.",
        ]
    }
}
