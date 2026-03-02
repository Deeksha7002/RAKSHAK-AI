import random
import logging
import json
from config import PERSONA, SENSITIVE_PATTERNS
from safety import SafetyGuard
from analyzer import ScamAnalyzer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [AGENT] - %(message)s')

class RakshakAgent:
    def __init__(self, state_dict=None):
        if state_dict:
            self.conversation_history = state_dict.get("conversation_history", [])
            self.classification_cache = state_dict.get("classification_cache", "benign")
            self.threat_score = state_dict.get("threat_score", 0.1)
            self.intent = state_dict.get("intent", "UNKNOWN")
            self.current_persona = state_dict.get("current_persona", "default")
            self.is_compromised = state_dict.get("is_compromised", False)
            self.auto_reported = state_dict.get("auto_reported", False)
            self.iocs = state_dict.get("iocs", {"urls":[], "domains":[], "paymentMethods":[], "sensitiveDataRedacted":0})
        else:
            self.conversation_history = []
            self.classification_cache = "benign"
            self.threat_score = 0.1
            self.intent = "UNKNOWN"
            self.current_persona = "default"
            self.is_compromised = False
            self.auto_reported = False
            self.iocs = {"urls":[], "domains":[], "paymentMethods":[], "sensitiveDataRedacted":0}
        
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
            "iocs": self.iocs
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
        # Note: analyzer.analyze_behavior expects a list of messages
        score, category, neuro_matrix = self.analyzer.analyze_behavior(self.conversation_history)
        self.threat_score = score
        
        # Determine intent (simplified for now)
        intent = "UNKNOWN"
        if score > 0.6:
            if any(k in text.lower() for k in ["bank", "card", "crypto", "wallet", "pay"]):
                intent = "MONEY"
            elif any(k in text.lower() for k in ["code", "otp", "pin", "verify"]):
                intent = "CODES"
            elif any(k in text.lower() for k in ["hurry", "fast", "immediately", "urgent"]):
                intent = "URGENCY"
            else:
                intent = "COLLECTING_PII"
        
        self.intent = intent

        # 4. Classification
        classification = self._classify(safe_text)
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
            "scamType": category
        }

    def generateResponse(self, classification, text):
        """
        Generates a persona-driven response. 
        Matches the signature expected by server.py: generateResponse(classification=..., text=...)
        """
        self.classification_cache = classification
        
        if classification == "benign":
            return None # server.py handles the fallback

        # Decide Persona based on threat score
        if self.threat_score < 0.4:
            self.current_persona = "naive"
        elif self.threat_score > 0.7:
            self.current_persona = "skeptical"
        else:
            self.current_persona = "default"

        persona_data = PERSONA.get(self.current_persona, PERSONA["default"])
        
        # Select a response
        response = random.choice(persona_data["safe_questions"])
        
        # Safety Check
        if not SafetyGuard.check_policy(response):
            response = "I'm not sure how to help with that right now."

        # Log our response
        self.conversation_history.append({"role": "agent", "content": response})
        logging.info(f"🤖 [AGENT RESPONSE]: {response}")
        
        return response

    def _classify(self, text):
        text_lower = text.lower()
        if any(kw in text_lower for kw in ["verify your wallet", "private key", "bank details", "earn $", "compromised"]):
            return "scam"
        if "http" in text_lower or ".com" in text_lower or ".io" in text_lower or ".xyz" in text_lower:
            return "likely_scam"
        return "benign"

    def _extract_iocs(self, text):
        # Extract URLs
        import re
        urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', text)
        for url in urls:
            if url not in self.iocs["urls"]:
                self.iocs["urls"].append(url)
                logging.info(f"Captured IOC [URL]: {url}")
