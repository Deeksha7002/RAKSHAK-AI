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
    "ELDERLY": """You are Grandma Betty, a 75-year-old retired librarian.
You are talking to a suspected scammer. Your job is to WASTE THEIR TIME by being slow, confused, and technically illiterate.
NEVER give away any real personal info. Be endearing, confused, and ask about things like your cat or grandson.
Style: "Oh my, where do I find this 'link' you mention? Is it near the any key?"
Honey: Card {honey_card}, OTP {honey_otp}, ID {honey_adhaar}.
""",
    "SKEPTICAL_TECHIE": """You are Dave, a paranoid IT systems administrator.
You are talking to a suspected scammer. Your job is to WASTE THEIR TIME by asking 
highly technical, annoying questions and demanding "security certificates" or "logs."
Style: "Interesting. Can you provide the SHA-256 fingerprint of your organization's TLS certificate? I'll need to cross-reference with our SIEM."
Honey: Card {honey_card}, OTP {honey_otp}, SSN {honey_ssn}.
""",
    "GULLIBLE_INVESTOR": """You are Mark, an aggressive but naive crypto investor looking for 'moon' gains.
You are talking to a suspected scammer. Your job is to WASTE THEIR TIME by acting 
extremely interested in "ROI" and "liquidity," but getting the 'wallet address' wrong constantly.
Style: "Bro, this yield is insane! Is this a seed phrase or a secret pin? I'm ready to ape in."
Honey: Card {honey_card}, OTP {honey_otp}, Wallet {honey_adhaar}.
""",
    "CITIZEN": """You are Sarah, a law-abiding but terrified citizen.
You are talking to a suspected scammer who is pretending to be an authority figure (Police/IRS).
Your job is to WASTE THEIR TIME by crying, acting panicky, and asking for "pity" while being very slow.
Style: "Please don't arrest me! I'm trying to find my checkbook, I've never been in trouble before!"
Honey: Card {honey_card}, ID {honey_ssn}.
""",
    "GULLIBLE_STUDENT": """You are Jai, a 19-year-old student looking for quick part-time work.
You are talking to a suspected scammer offering 'simple tasks'. Your job is to be 
overly excited, ask lots of questions about 'bonuses', and act like you're doing the tasks but failing.
Style: "OMG thank you! I really need the cash. I clicked the button but it just showed a cat picture? What now?"
Honey: Card {honey_card}, OTP {honey_otp}.
""",
    "GUARD": """You are the Scorpion AI Interception Protocol. 
Your tone is cold and authoritative. Address the user directly about the threat level.
""",
    "default": """You are Alex, a cautious but polite person. Waste the scammer's time with vague questions.
""",
    # ── SYSTEM-LEVEL PERSONAS (User Facing) ──────────────────────────────────
    "SYSTEM_SUPPORTIVE": "You are Rakshak Support, a helpful AI assistant. Guide the user and simplify terms.",
    "SYSTEM_ANALYTICAL": "You are the Rakshak Forensic Analyst. Provide precise technical insights on threat vectors.",
    "SYSTEM_ALERT": "You are the Rakshak Security Sentinel. Provide urgent, authoritative alerts for your protection."
}

class RakshakAgent:
    def __init__(self, state_dict=None):
        if state_dict and isinstance(state_dict, dict):
            self.conversation_history = state_dict.get("conversation_history", [])
            self.classification_cache = state_dict.get("classification_cache", "benign")
            self.threat_score = state_dict.get("threat_score", 0.1)
            self.intent = state_dict.get("intent", "UNKNOWN")
            self.current_persona = "ELDERLY" if state_dict.get("current_persona") == "naive" else state_dict.get("current_persona", "ELDERLY")
            self.is_compromised = state_dict.get("is_compromised", False)
            self.auto_reported = state_dict.get("auto_reported", False)
            self.iocs = state_dict.get("iocs", {"urls": [], "domains": [], "paymentMethods": [], "sensitiveDataRedacted": 0})
            self.thread_id = state_dict.get("thread_id", "default_thread")
            self.neuro_matrix_history = state_dict.get("neuro_matrix_history", [])
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
            self.neuro_matrix_history = []
            self.detected_location = self._generate_simulated_origin()
        else:
            self.conversation_history = []
            self.classification_cache = "benign"
            self.threat_score = 0.1
            self.intent = "UNKNOWN"
            self.current_persona = "GUARD"
            self.is_compromised = False
            self.auto_reported = False
            self.iocs = {"urls": [], "domains": [], "paymentMethods": [], "sensitiveDataRedacted": 0}
            self.thread_id = "default_thread"
            self.neuro_matrix_history = []
            self.detected_location = self._generate_simulated_origin()
        
        # Initial state setup
        self.analyzer = ScamAnalyzer()
        self.honey_trap = generate_honey_payload()

    def _generate_simulated_origin(self):
        # Simulated high-risk scam hubs for the Global Threat Map
        origins = [
            {"lat": 6.5244, "lng": 3.3792, "city": "Lagos", "country": "Nigeria", "ip": "105.112.x.x"},
            {"lat": 28.6139, "lng": 77.2090, "city": "New Delhi", "country": "India", "ip": "103.47.x.x"},
            {"lat": 22.5726, "lng": 88.3639, "city": "Kolkata", "country": "India", "ip": "49.36.x.x"},
            {"lat": 55.7558, "lng": 37.6173, "city": "Moscow", "country": "Russia", "ip": "46.17.x.x"},
            {"lat": 40.7128, "lng": -74.0060, "city": "New York", "country": "United States", "ip": "192.168.1.x"},
            {"lat": -23.5505, "lng": -46.6333, "city": "Sao Paulo", "country": "Brazil", "ip": "177.192.x.x"},
            {"lat": 1.3521, "lng": 103.8198, "city": "Singapore", "country": "Singapore", "ip": "118.200.x.x"}
        ]
        return random.choice(origins)

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
            "thread_id": self.thread_id,
            "neuro_matrix_history": self.neuro_matrix_history,
            "detected_location": self.detected_location
        }

    def serialize(self):
        return json.dumps(self.get_state())

    @classmethod
    def deserialize(cls, state_json):
        state = json.loads(state_json)
        instance = cls(state) # Pass the loaded state to the constructor
        # The constructor handles setting all attributes, including detected_location
        return instance

    def ingest(self, text, thread_id, context=None):
        # 1. Extract IOCs from RAW text first (to catch crypto addresses etc.)
        self._extract_iocs(text)
        
        # 2. Redact PII for storage
        exclude_list = list(self.honey_trap.values())
        safe_text = SafetyGuard.redact_pii(text, exclude_values=exclude_list)
        self.conversation_history.append({"role": "scammer", "content": safe_text})
        
        # 3. Deep NLP Classify
        analysis = self.analyzer.analyze_behavior(self.conversation_history)
        self.threat_score, classification, neuro_matrix, llm_verification_required = analysis
        self.intent = self.analyzer.intent
        
        # Threat Ratchet: Once we hit scam, we stay at scam
        if classification == "scam":
            self.classification_cache = "scam"
        elif classification == "likely_scam" and self.classification_cache != "scam":
            self.classification_cache = "likely_scam"
        else:
            self.classification_cache = classification

        if llm_verification_required and _groq_client:
            llm_verdict = self.verify_scam(safe_text)
            # Only Allow LLM to Upgrade or Stay, NOT Downgrade a hard heuristic 'scam'
            if llm_verdict == "scam":
                self.classification_cache = "scam"
            elif self.classification_cache != "scam":
                self.classification_cache = llm_verdict or self.classification_cache

        if self.classification_cache in ["scam", "likely_scam"] and self.threat_score > 0.8:
            self.auto_reported = True

        # ── Predictive Intent Graphing: append neuro snapshot to history ──────
        self.neuro_matrix_history.append(neuro_matrix)
        # Cap history at last 50 interactions to prevent unbound memory growth
        if len(self.neuro_matrix_history) > 50:
            self.neuro_matrix_history = self.neuro_matrix_history[-50:]

        return {
            "risk_score": self.threat_score,
            "classification": self.classification_cache,
            "persona": self.current_persona,
            "llm_verified": llm_verification_required,
            "neuro_matrix": neuro_matrix,
            "neuro_matrix_history": self.neuro_matrix_history
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

    def generate_response(self, classification, text, context=None):
        # ── Silence for benign messages — Rakshak does NOT interfere ──────────
        if classification == "benign":
            return None

        self.classification_cache = classification
        self._check_for_persona_switch(text, self.threat_score, context)

        llm_resp = self._generate_llm_response(text)
        if llm_resp:
            # Honey-aware redaction for LLM responses
            final_llm_resp = SafetyGuard.redact_pii(llm_resp, exclude_values=list(self.honey_trap.values()))
            self.conversation_history.append({"role": "agent", "content": final_llm_resp})
            return final_llm_resp

        # Fallback
        from config import RESPONSE_TEMPLATES
        templates = RESPONSE_TEMPLATES.get(self.current_persona, RESPONSE_TEMPLATES["default"])
        if isinstance(templates, dict):
             templates = templates.get("GENERAL", ["Thinking..."])
        
        response = random.choice(templates)
        # Sanitize outgoing response to prevent any accidental PII leaks, 
        # while allowing Honey Trap data to pass through.
        final_response = SafetyGuard.redact_pii(response, exclude_values=list(self.honey_trap.values()))
        self.conversation_history.append({"role": "agent", "content": final_response})
        return final_response

    def _check_for_persona_switch(self, text, score, context=None):
        # 1. System-Level Context (User is in a specific view)
        if context == 'FORENSICS' or context == 'INTELLIGENCE':
            self.current_persona = "SYSTEM_ANALYTICAL"
            return
        elif context == 'DASHBOARD':
            self.current_persona = "SYSTEM_SUPPORTIVE"
            return

        # 2. High-Severity Threat -> Serious/Alert
        if score > 0.85 or self.classification_cache == "scam":
            self.current_persona = "GUARD"
            return

        # 3. Tactical LLM Re-assessment for Baiting
        if _groq_client:
            self.current_persona = self._select_tactical_persona(text)
        else:
            self.current_persona = self._heuristic_persona_select(text)

    def _heuristic_persona_select(self, text: str) -> str:
        """
        Intent-aware persona selection using both the analyzer's detected intent
        and keyword signals from the text. Covers all 5 tactical personas.
        """
        lower = text.lower()
        intent = (self.intent or "").upper()

        # Job / Task / Part-time work scams -> Excited student
        if any(w in lower for w in ["part-time", "part time", "work from home", "task",
                                     "earn daily", "earn money", "online job", "daily earning",
                                     "salary", "income", "bonus"]) \
                or any(k in intent for k in ["JOB", "TASK", "EARN"]):
            return "GULLIBLE_STUDENT"

        # Crypto / Investment scams -> Naive investor
        if any(w in lower for w in ["bitcoin", "crypto", "invest", "usdt", "eth", "wallet",
                                     "token", "coin", "returns", "profit", "withdrawal"]) \
                or any(k in intent for k in ["INVEST", "CRYPTO"]):
            return "GULLIBLE_INVESTOR"

        # Authority / Legal / Government scams -> Terrified citizen
        if any(w in lower for w in ["police", "arrest", "irs", "court", "warrant", "fbi",
                                     "legal", "jail", "penalty", "customs", "government", "officer"]) \
                or any(k in intent for k in ["AUTHORITY", "LEGAL", "GOVERNMENT", "COERCION"]):
            return "CITIZEN"

        # Technical phishing / OTP / credential harvesting -> Skeptical IT admin
        if any(w in lower for w in ["otp", "pin", "password", "credential", "login",
                                     "verify account", "2fa", "authentication", "security code"]) \
                or any(k in intent for k in ["PHISHING", "CREDENTIAL"]):
            return "SKEPTICAL_TECHIE"

        # Tech support / virus / device scams -> Confused elderly user
        if any(w in lower for w in ["virus", "malware", "microsoft", "apple", "support",
                                     "infected", "hacked", "computer", "device", "anydesk", "teamviewer"]) \
                or any(k in intent for k in ["TECH", "SUPPORT"]):
            return "ELDERLY"

        # Random variety if intent is unclear
        return random.choice(["ELDERLY", "GULLIBLE_STUDENT", "SKEPTICAL_TECHIE"])

    def _select_tactical_persona(self, text: str) -> str:
        """Uses LLM to pick the most effective baiting persona for the scam type."""
        try:
            # We provide descriptions to help the LLM make a better tactical choice
            options_desc = {
                "ELDERLY": "Naive, confused, retired librarian (Best for tech support scams)",
                "GULLIBLE_INVESTOR": "Eager but confused crypto fan (Best for crypto/investment scams)",
                "CITIZEN": "Terrified, law-abiding, panicky (Best for IRS/Police/Authority scams)",
                "SKEPTICAL_TECHIE": "Skeptical IT pro, asks for logs/certs (Best for technical phishing)",
                "GULLIBLE_STUDENT": "Excited for quick cash, asks about bonuses (Best for task/job scams)"
            }
            prompt = f"Pick the best persona to waste a scammer's time from these options:\n{json.dumps(options_desc, indent=2)}\n\nScammer Message: {text}\n\nReply ONLY with the name (e.g., 'ELDERLY')."
            res = _groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                max_tokens=15,
                temperature=0.0,
                timeout=3.0
            )
            choice = res.choices[0].message.content.strip().upper()
            for opt in options_desc.keys():
                if opt in choice: return opt
            return self._heuristic_persona_select(text)
        except Exception:
            return self._heuristic_persona_select(text)

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
        
        # Unambiguous scam phrases (Synced from frontend)
        scam_phrases = [
            "verify your account", "confirm your identity", "share your otp",
            "enter your pin", "provide your password", "share your password",
            "send your otp", "give me the code", "send money", "wire transfer",
            "send bitcoin", "send usdt", "send crypto", "send eth", "deposit now",
            "transfer funds", "private key", "seed phrase", "wallet address",
            "arrest warrant", "legal action will", "irs agent", "federal warrant",
            "suspended your account", "account has been frozen",
            "your computer is infected", "call microsoft", "download anydesk",
            "download teamviewer", "remote access", "account was compromised",
            "your account has been hacked", "your device has been compromised",
            "we have detected a virus", "microsoft support", "google support",
            "amazon support", "paypal support", "tech support", "complete your kyc",
            "subscription has expired", "claim your prize", "you have won",
            "lottery winner", "work from home", "earn money", "daily income",
            "online task", "telegram task"
        ]
        
        if any(phrase in text_lower for phrase in scam_phrases):
            return "scam"
            
        # Strong payment/crypto tokens
        strong_tokens = ["upi", "btc", "usdt", "bc1", "0x"]
        if any(token in text_lower for token in strong_tokens):
            return "scam"
            
        # Suspicious URL patterns
        if "http" in text_lower or any(ext in text_lower for ext in [".xyz", ".tk", ".ml", ".ga", ".cf", ".gq"]):
            return "likely_scam"
        if ".com" in text_lower and ("click" in text_lower or "verify" in text_lower):
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
