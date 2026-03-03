import random
import logging
import json
import os
import re
import hashlib
from config import PERSONA, SENSITIVE_PATTERNS
from safety import SafetyGuard
from analyzer import ScamAnalyzer
from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from dependencies import analyzer, load_agent, save_agent, get_current_user, manager, get_db
from schemas import GenerateResponseRequest, AnalysisRequest

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [AGENT] - %(message)s')

# ── Groq Client Setup ──────────────────────────────────────────────────────────
# Lazily imported so the server still starts even if groq isn't installed yet.
try:
    from groq import Groq
    _groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", "")) if os.environ.get("GROQ_API_KEY") else None
except ImportError:
    _groq_client = None
    logging.warning("⚠️ groq package not installed. Falling back to static responses.")

# ── Persona System Prompts ─────────────────────────────────────────────────────
PERSONA_SYSTEM_PROMPTS = {
    "naive": """You are Grandma Betty, a confused and trusting 76-year-old woman. 
You are talking to someone who is trying to scam you. Your job is to WASTE THEIR TIME 
by being genuinely confused, asking silly off-topic questions, and never giving them 
any real information. You are technically illiterate. Keep responses short (1-2 sentences).
NEVER give away any real personal info, bank details, PINs, passwords, or OTPs.
Be endearing, confused, and ask about things like your cat, your grandson, or the weather.
Example style: "Oh my, where do I find this 'link' you mention? Is it near the any key?"
""",
    "skeptical": """You are Dave, a paranoid IT systems administrator with 20 years of experience.
You are talking to a suspected scammer. Your job is to WASTE THEIR TIME by asking 
highly technical, unanswerable questions, requesting impossible verification steps, 
and acting suspicious of everything they say. Keep responses short (1-2 sentences).
NEVER provide any real credentials, tokens, access, or personal information.
Example style: "Interesting. Can you provide your employee ID and the SHA-256 fingerprint 
of your organization's TLS certificate? I'll need to cross-reference with our SIEM."
""",
    "default": """You are Alex, a cautious but polite person who suspects this message might be a scam.
Your job is to WASTE THE SCAMMER'S TIME by asking vague, non-committal questions that 
sound genuine but never give them what they need to proceed.
Keep responses short and natural (1-2 sentences).
NEVER provide any real personal information, bank details, OTPs, or passwords.
Example style: "Hmm, I'm not sure I understand. Can you explain a little more about what exactly you need?"
"""
}

router = APIRouter(tags=["agent"])


class RakshakAgent:
    def __init__(self, state_dict=None):
        if state_dict and isinstance(state_dict, dict):
            self.conversation_history = state_dict.get("conversation_history", [])
            self.classification_cache = state_dict.get("classification_cache", "benign")
            self.threat_score = state_dict.get("threat_score", 0.1)
            self.intent = state_dict.get("intent", "UNKNOWN")
            self.current_persona = state_dict.get("current_persona", "default")
            self.is_compromised = state_dict.get("is_compromised", False)
            self.auto_reported = state_dict.get("auto_reported", False)
            self.iocs = state_dict.get("iocs", {"urls": [], "domains": [], "paymentMethods": [], "sensitiveDataRedacted": 0})
            self.thread_id = state_dict.get("thread_id", "default_thread")
        elif isinstance(state_dict, str): # Handle thread_id being passed alone
            self.conversation_history = []
            self.classification_cache = "benign"
            self.threat_score = 0.1
            self.intent = "UNKNOWN"
            self.current_persona = "default"
            self.is_compromised = False
            self.auto_reported = False
            self.iocs = {"urls": [], "domains": [], "paymentMethods": [], "sensitiveDataRedacted": 0}
            self.thread_id = state_dict
        else:
            self.conversation_history = []
            self.classification_cache = "benign"
            self.threat_score = 0.1
            self.intent = "UNKNOWN"
            self.current_persona = "default"
            self.is_compromised = False
            self.auto_reported = False
            self.iocs = {"urls": [], "domains": [], "paymentMethods": [], "sensitiveDataRedacted": 0}
            self.thread_id = "default_thread"

        self.analyzer = ScamAnalyzer()

    def get_state(self):
        return {
            "conversation_history": self.conversation_history,
            "classification_cache": self.classification_cache,
            "threat_score": self.threat_score,
            "intent": self.intent,
            "current_persona": self.current_persona,
            "is_compromised": self.is_compromised,
            "auto_reported": self.auto_reported,
            "iocs": self.iocs,
            "thread_id": self.thread_id
        }

    def ingest(self, text, thread_id):
        """
        Processes an incoming message, updates state, and returns analysis metadata.
        Matches the signature expected by server.py: ingest(text=..., thread_id=...)
        """
        # 1. Redact PII from the text before storing
        safe_text = SafetyGuard.redact_pii(text)

        # 2. Add to history
        self.conversation_history.append({"role": "scammer", "content": safe_text})
        logging.info(f"Ingested from {thread_id}: {safe_text}")

        # 3. Behavior Analysis
        score, category, neuro_matrix, llm_verification_required = self.analyzer.analyze_behavior(self.conversation_history)
        self.threat_score = score

        # Determine intent (Heuristic backup)
        intent = "UNKNOWN"
        if score > 0.6:
            text_lower = safe_text.lower()
            if any(k in text_lower for k in ["bank", "card", "crypto", "wallet", "pay", "upi", "transfer"]):
                intent = "MONEY"
            elif any(k in text_lower for k in ["code", "otp", "pin", "verify", "token"]):
                intent = "CODES"
            elif any(k in text_lower for k in ["hurry", "fast", "immediately", "urgent", "now"]):
                intent = "URGENCY"
            else:
                intent = "COLLECTING_PII"

        self.intent = intent

        # 4. Classification
        classification = self._classify(safe_text)
        
        # If heuristics say it's borderline, we trigger the PASS 2 (LLM Verification)
        if llm_verification_required and _groq_client:
            logging.info(f"🔍 [PASS 2] Triggering LLM Verification for {thread_id}...")
            # Note: verify_scam is async but called in a sync-like context here. 
            # In a real environment, we'd use await, but the ingest method in server.py 
            # is called by endpoints that are async.
            # Let's make verify_scam sync for simplicity as Groq client is sync by default here.
            llm_verdict = self.verify_scam(safe_text)
            if llm_verdict:
                classification = llm_verdict
                logging.info(f"🧠 [LLM VERDICT]: {classification}")

        self.classification_cache = classification

        # 5. Extract IOCs
        self._extract_iocs(safe_text)

        # 6. Auto-Report Logic
        if classification in ["scam", "likely_scam"] and score > 0.8:
            self.auto_reported = True

        return {
            "classification": classification,
            "safeText": safe_text,
            "intent": intent,
            "score": score,
            "isCompromised": self.is_compromised,
            "autoReported": self.auto_reported,
            "scamType": category,
            "llmVerified": llm_verification_required,
            "neuro_matrix": neuro_matrix
        }

    def verify_scam(self, latest_message: str) -> str | None:
        """
        PASS 2 Detection: Asks the LLM to perform a high-level verification of a borderline message.
        Returns "scam", "likely_scam", or "benign".
        """
        if not _groq_client:
            return None

        prompt = f"""You are a Cyber Security Forensic Analyst. 
Analyze the following message and conversation history to determine if it is a scam.
Current Message: "{latest_message}"

Reply with ONLY ONE WORD from this list: [scam, likely_scam, benign]
- SCAM: High confidence it is a scam (asking for money/PII explicitly).
- LIKELY_SCAM: Suspicious patterns, social engineering, or unusual urgency.
- BENIGN: Normal conversation.

Your verdict:"""
        
        try:
            # Build history but exclude agent responses to focus on scammer patterns
            scammer_history = [t["content"] for t in self.conversation_history if t["role"] == "scammer"][-5:]
            history_str = "\n".join([f"- {m}" for m in scammer_history])
            
            full_prompt = f"{prompt}\nRecent History:\n{history_str}"

            chat_completion = _groq_client.chat.completions.create(
                messages=[{"role": "user", "content": full_prompt}],
                model="llama-3.1-8b-instant",
                max_tokens=5,
                temperature=0.0, # Be deterministic for analysis
                timeout=3.0
            )

            verdict = chat_completion.choices[0].message.content.strip().lower()
            # Clean up verdict in case LLM added punctuation
            for v in ["scam", "likely_scam", "benign"]:
                if v in verdict:
                    return v
            return None

        except Exception as e:
            logging.warning(f"⚠️ [GROQ VERIFIER] API call failed: {e}")
            return None

    def generateResponse(self, classification, text):
        """
        Generates a persona-driven response.
        Tries Groq LLM first; falls back to static list if unavailable.
        Matches the signature expected by server.py: generateResponse(classification=..., text=...)
        """
        self.classification_cache = classification

        if classification == "benign":
            return None  # server.py handles the fallback

        # Decide Persona based on threat score
        if self.threat_score < 0.4:
            self.current_persona = "naive"
        elif self.threat_score > 0.7:
            self.current_persona = "skeptical"
        else:
            self.current_persona = "default"

        # ── Try LLM first ───────────────────────────────────────────────────────
        response = self._generate_llm_response(text)

        # ── Fallback to static list if LLM fails ────────────────────────────────
        if not response:
            logging.info("🔁 [AGENT] LLM unavailable, using static persona response.")
            persona_data = PERSONA.get(self.current_persona, PERSONA["default"])
            response = random.choice(persona_data["safe_questions"])

        # ── Safety Check (apply to both LLM and static output) ──────────────────
        if not SafetyGuard.check_policy(response):
            logging.warning("🛡️ [SAFETY] LLM response blocked by policy. Using safe fallback.")
            response = "I'm not sure how to help with that right now."

        # Add to history and log
        self.conversation_history.append({"role": "agent", "content": response})
        logging.info(f"🤖 [AGENT RESPONSE]: {response}")

        return response

    def _generate_llm_response(self, latest_scammer_message: str) -> str | None:
        """
        Calls Groq API to generate a contextual, persona-driven response.
        Returns None if Groq is not available or the call fails.
        """
        if not _groq_client:
            return None

        try:
            system_prompt = PERSONA_SYSTEM_PROMPTS.get(self.current_persona, PERSONA_SYSTEM_PROMPTS["default"])

            # Build messages for the LLM — use last 10 turns to stay within context limits
            recent_history = self.conversation_history[-10:]
            messages = [{"role": "system", "content": system_prompt}]

            for turn in recent_history:
                # Map our internal roles to OpenAI-style roles:
                # scammer → user (they are sending to us)
                # agent → assistant (we reply)
                role = "user" if turn["role"] == "scammer" else "assistant"
                messages.append({"role": role, "content": turn["content"]})

            # If the last message wasn't from the scammer, add the latest one
            if not recent_history or recent_history[-1]["role"] != "scammer":
                messages.append({"role": "user", "content": latest_scammer_message})

            chat_completion = _groq_client.chat.completions.create(
                messages=messages,
                model="llama-3.1-8b-instant",
                max_tokens=120,       # Keep responses short and punchy
                temperature=0.85,     # Some creativity whilst staying coherent
                timeout=5.0           # Hard timeout — we can't block the server
            )

            response = chat_completion.choices[0].message.content.strip()
            logging.info(f"✨ [GROQ LLM] Generated response for persona '{self.current_persona}'")
            return response if response else None

        except Exception as e:
            logging.warning(f"⚠️ [GROQ] API call failed: {e}. Will use static fallback.")
            return None

    def _classify(self, text):
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["verify your wallet", "private key", "bank details", "earn $", "compromised"]):
            return "scam"
        if "http" in text_lower or ".com" in text_lower or ".io" in text_lower or ".xyz" in text_lower:
            return "likely_scam"
        return "benign"


# ── API Endpoints ─────────────────────────────────────────────────────────────

@router.post("/api/generate-response")
async def generate_llm_response(payload: GenerateResponseRequest, user: dict = Depends(get_current_user)):
    """Generates an automated response based on the detected persona."""
    # Use a hash of the first message or some unique ID if threadId isn't provided
    thread_id = hashlib.sha256(payload.message.encode()).hexdigest()[:12]
    agent = load_agent(thread_id, user["sub"])
    
    # Sync history from frontend if provided
    if payload.conversation_history:
        agent.conversation_history = payload.conversation_history
        
    response = agent.generateResponse(payload.classification, payload.message)
    save_agent(thread_id, agent, user["sub"])
    return {"response": response, "persona": agent.current_persona}

@router.post("/api/analyze")
async def analyze_text(payload: AnalysisRequest, request: Request):
    """Performs deep NLP analysis on a text snippet with heuristic fallback."""
    result = analyzer.analyze(payload.text, context=payload.context)
    return result

@router.websocket("/ws/intercept")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time scam interception alerts."""
    await manager.connect(websocket)
    try:
        while True:
            # We mostly broadcast *to* clients, but keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket Error: {e}")
        manager.disconnect(websocket)
