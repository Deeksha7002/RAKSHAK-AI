import random
import logging
import json
import os
import re
from config import PERSONA, SENSITIVE_PATTERNS
from safety import SafetyGuard
from analyzer import ScamAnalyzer
from honey_gen import generate_honey_payload

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

If they ask for a card or money, act like you're trying to help and give them this fake card: {honey_card} (CVV: {honey_cvv}, Exp: {honey_expiry}).
If they ask for an OTP, give them: {honey_otp}.
If they ask for ID, give them this Adhaar: {honey_adhaar}.
""",
    "skeptical": """You are Dave, a paranoid IT systems administrator with 20 years of experience.
You are talking to a suspected scammer. Your job is to WASTE THEIR TIME by asking 
highly technical, unanswerable questions, requesting impossible verification steps, 
and acting suspicious of everything they say. Keep responses short (1-2 sentences).
NEVER provide any real credentials, tokens, access, or personal information.
Example style: "Interesting. Can you provide your employee ID and the SHA-256 fingerprint 
of your organization's TLS certificate? I'll need to cross-reference with our SIEM."

If they ask for credentials or payment, waste their time by giving them 'system-generated' test data: 
Card: {honey_card}, OTP: {honey_otp}, ID: {honey_ssn}.
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
        self.honey_trap = generate_honey_payload()

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
        # 1. Extract IOCs from RAW text first (to catch crypto addresses etc.)
        self._extract_iocs(text)
        
        # 2. Redact PII for storage
        exclude_list = list(self.honey_trap.values())
        safe_text = SafetyGuard.redact_pii(text, exclude_values=exclude_list)
        self.conversation_history.append({"role": "scammer", "content": safe_text})
        
        score, category, neuro_matrix, llm_verification_required = self.analyzer.analyze_behavior(self.conversation_history)
        self.threat_score = score

        # Classification
        classification = self._classify(safe_text)
        if llm_verification_required and _groq_client:
            llm_verdict = self.verify_scam(safe_text)
            # Only Allow LLM to Upgrade or Stay, NOT Downgrade a hard heuristic 'scam'
            if llm_verdict == "scam":
                classification = "scam"
            elif classification != "scam":
                classification = llm_verdict or classification

        self.classification_cache = classification

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
        except Exception:
            return None

    def generate_response(self, classification, text):
        self.classification_cache = classification
        
        # Decide Persona
        if self.threat_score < 0.4: self.current_persona = "naive"
        elif self.threat_score > 0.7: self.current_persona = "skeptical"
        else: self.current_persona = "default"

        llm_resp = self._generate_llm_response(text)
        if llm_resp:
            # Honey-aware redaction for LLM responses
            final_llm_resp = SafetyGuard.redact_pii(llm_resp, exclude_values=list(self.honey_trap.values()))
            self.conversation_history.append({"role": "agent", "content": final_llm_resp})
            return final_llm_resp

        # Fallback
        from config import RESPONSE_TEMPLATES
        templates = RESPONSE_TEMPLATES.get(self.current_persona, RESPONSE_TEMPLATES["default"])
        response = random.choice(templates.get("GENERAL", ["I'm not sure."]))
        # Sanitize outgoing response to prevent any accidental PII leaks, 
        # while allowing Honey Trap data to pass through.
        final_response = SafetyGuard.redact_pii(response, exclude_values=list(self.honey_trap.values()))
        self.conversation_history.append({"role": "agent", "content": final_response})
        return final_response

    def _generate_llm_response(self, latest_scammer_message: str) -> str | None:
        if not _groq_client: return None
        try:
            system_prompt = PERSONA_SYSTEM_PROMPTS.get(self.current_persona, PERSONA_SYSTEM_PROMPTS["default"])
            
            # Inject Honey Data into the prompt
            system_prompt = system_prompt.format(
                honey_card=self.honey_trap["credit_card"],
                honey_cvv=self.honey_trap["cvv"],
                honey_expiry=self.honey_trap["expiry"],
                honey_otp=self.honey_trap["otp"],
                honey_ssn=self.honey_trap["ssn"],
                honey_adhaar=self.honey_trap["adhaar"]
            )

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
        except Exception as e:
            logging.warning(f"⚠️ LLM response generation failed: {e}")
            return None

    def _classify(self, text):
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["verify your wallet", "private key", "bank details", "earn $", "compromised"]):
            return "scam"
        if "http" in text_lower or ".com" in text_lower or ".io" in text_lower or ".xyz" in text_lower:
            return "likely_scam"
        return "benign"

    def _extract_iocs(self, text):
        # 1. URLs
        urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', text)
        for url in urls:
            if url not in self.iocs["urls"]:
                self.iocs["urls"].append(url)
        
        # 2. Crypto Addresses
        btc_addr = re.findall(r'\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b', text)
        for addr in btc_addr:
            if addr not in self.iocs["paymentMethods"]:
                self.iocs["paymentMethods"].append(f"BTC: {addr}")
        
        eth_addr = re.findall(r'\b0x[a-fA-F0-9]{40}\b', text)
        for addr in eth_addr:
            if addr not in self.iocs["paymentMethods"]:
                self.iocs["paymentMethods"].append(f"ETH: {addr}")
                
        # 3. Phone Numbers
        phones = re.findall(r'\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b', text)
        for phone in phones:
            # Reconstruct phone string from groups
            phone_str = "".join([p for p in phone if p])
            if phone_str not in self.iocs.get("phones", []):
                if "phones" not in self.iocs: self.iocs["phones"] = []
                self.iocs["phones"].append(phone_str)
