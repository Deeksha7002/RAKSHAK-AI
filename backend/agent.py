import random
import logging
import json
import os
import re
from config import PERSONA, SENSITIVE_PATTERNS
from safety import SafetyGuard
from analyzer import ScamAnalyzer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [AGENT] - %(message)s')

# ── Groq Client Setup ──────────────────────────────────────────────────────────
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
        elif isinstance(state_dict, str):
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

    def serialize(self):
        return json.dumps(self.get_state())

    @classmethod
    def deserialize(cls, state_json):
        return cls(json.loads(state_json))

    def ingest(self, text, thread_id):
        safe_text = SafetyGuard.redact_pii(text)
        self.conversation_history.append({"role": "scammer", "content": safe_text})
        
        score, category, neuro_matrix, llm_verification_required = self.analyzer.analyze_behavior(self.conversation_history)
        self.threat_score = score

        # Classification
        classification = self._classify(safe_text)
        if llm_verification_required and _groq_client:
            llm_verdict = self.verify_scam(safe_text)
            if llm_verdict:
                classification = llm_verdict

        self.classification_cache = classification
        self._extract_iocs(safe_text)

        if classification in ["scam", "likely_scam"] and score > 0.8:
            self.auto_reported = True

        return {
            "risk_score": score,
            "classification": classification,
            "llm_verified": llm_verification_required,
            "neuro_matrix": neuro_matrix
        }

    def verify_scam(self, text):
        if not _groq_client: return None
        try:
            prompt = f"Analyze this potential scam message. Is it a scam? Reply only 'scam' or 'safe'.\nMessage: {text}"
            res = _groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                max_tokens=5,
                temperature=0.0
            )
            verdict = res.choices[0].message.content.strip().lower()
            return "scam" if "scam" in verdict else "benign"
        except:
            return None

    def generate_response(self, classification, text):
        self.classification_cache = classification
        
        # Decide Persona
        if self.threat_score < 0.4: self.current_persona = "naive"
        elif self.threat_score > 0.7: self.current_persona = "skeptical"
        else: self.current_persona = "default"

        llm_resp = self._generate_llm_response(text)
        if llm_resp:
            self.conversation_history.append({"role": "agent", "content": llm_resp})
            return llm_resp

        # Fallback
        from config import RESPONSE_TEMPLATES
        templates = RESPONSE_TEMPLATES.get(self.current_persona, RESPONSE_TEMPLATES["default"])
        response = random.choice(templates.get("GENERAL", ["I'm not sure."]))
        self.conversation_history.append({"role": "agent", "content": response})
        return response

    def _generate_llm_response(self, latest_scammer_message: str) -> str | None:
        if not _groq_client: return None
        try:
            system_prompt = PERSONA_SYSTEM_PROMPTS.get(self.current_persona, PERSONA_SYSTEM_PROMPTS["default"])
            messages = [{"role": "system", "content": system_prompt}]
            for turn in self.conversation_history[-10:]:
                role = "user" if turn["role"] == "scammer" else "assistant"
                messages.append({"role": role, "content": turn["content"]})
            
            if not self.conversation_history or self.conversation_history[-1]["role"] != "scammer":
                messages.append({"role": "user", "content": latest_scammer_message})

            chat_completion = _groq_client.chat.completions.create(
                messages=messages,
                model="llama-3.1-8b-instant",
                max_tokens=120,
                temperature=0.85,
                timeout=5.0
            )
            return chat_completion.choices[0].message.content.strip()
        except:
            return None

    def _classify(self, text):
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["verify your wallet", "private key", "bank details", "earn $", "compromised"]):
            return "scam"
        if "http" in text_lower or ".com" in text_lower or ".io" in text_lower or ".xyz" in text_lower:
            return "likely_scam"
        return "benign"

    def _extract_iocs(self, text):
        urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', text)
        for url in urls:
            if url not in self.iocs["urls"]:
                self.iocs["urls"].append(url)
