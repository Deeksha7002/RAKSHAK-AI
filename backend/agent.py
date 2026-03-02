import random
import logging
from config import PERSONA
from safety import SafetyGuard
from analyzer import ScamAnalyzer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [AGENT] - %(message)s')

class HoneypotAgent:
    def __init__(self, state_dict=None):
        if state_dict:
            self.conversation_history = state_dict.get("conversation_history", {})
            self.classification_cache = state_dict.get("classification_cache", {})
            self.sophistication_cache = state_dict.get("sophistication_cache", {})
        else:
            self.conversation_history = {} # store history per conversation_id
            self.classification_cache = {}
            self.sophistication_cache = {} # store sophistication score per conv_id
        
        self.analyzer = ScamAnalyzer()

    def get_state(self):
        return {
            "conversation_history": self.conversation_history,
            "classification_cache": self.classification_cache,
            "sophistication_cache": self.sophistication_cache
        }

    def ingest(self, message):
        """
        Entry point for a new message.
        """
        conv_id = message['conversation_id']
        text = message['text']
        
        # 1. Redact incoming PII immediately for storage/logs
        safe_text = SafetyGuard.redact_pii(text)
        logging.info(f"Ingested from {conv_id}: {safe_text}")
        
        if conv_id not in self.conversation_history:
            self.conversation_history[conv_id] = []
        
        self.conversation_history[conv_id].append({"role": "scammer", "content": safe_text})
        
        # 2. Classify (Scam vs Benign)
        classification = self._classify(safe_text)
        self.classification_cache[conv_id] = classification
        
        # 3. Analyze Sophistication
        score, category, neuro_matrix = self.analyzer.analyze_behavior(self.conversation_history[conv_id])
        self.sophistication_cache[conv_id] = {"score": score, "category": category, "matrix": neuro_matrix}
        
        # 4. Extract IOCs
        self._extract_iocs(safe_text)

        # 5. AUTOMATED REPORTING (New)
        if classification in ["scam", "likely_scam"]:
             self.report_to_cyber_cell(conv_id, classification)
        
        return classification

    def report_to_cyber_cell(self, conversation_id, threat_level):
        """
        Simulates sending a formal report (JSON + PDF) to the Cyber Cell.
        """
        logging.info(f"🚨 [AUTO-REPORT] High threat detected for {conversation_id} ({threat_level})")
        logging.info(f"📤 [AUTO-REPORT] Generating JSON metadata...")
        logging.info(f"📄 [AUTO-REPORT] Generating Evidence_Report_{conversation_id}.pdf...")
        logging.info(f"✅ [AUTO-REPORT] Successfully transmitted to Cyber Cell reporting portal.")

    def _classify(self, text):
        """
        Simple keyword-based classifier for demonstration.
        In a real system, this would be an ML model.
        """
        scam_keywords = ["verify your wallet", "private key", "bank details", "earn $", "compromised", "limited spots"]
        text_lower = text.lower()
        
        for kw in scam_keywords:
            if kw in text_lower:
                return "scam"
        
        if "http" in text_lower or ".com" in text_lower:
            return "likely_scam"
            
        return "benign"

    def _extract_iocs(self, text):
        """
        Extracts non-sensitive IOCs like URLs.
        """
        if "http" in text:
             logging.info(f"IOC Captured [URL]: {text}") 

    def generate_response(self, conversation_id):
        """
        Decides on a response based on classification and persona.
        """
        classification = self.classification_cache.get(conversation_id, "benign")
        
        if classification == "benign":
            # Disengage or simple reply
            return None # Don't engage benign users in this honeypot logic
        
        # Scam Engagement Logic
        response = self._create_persona_response(conversation_id)
        
        # Safety Check
        if not SafetyGuard.check_policy(response):
            response = "I'm not comfortable with that."
            
        # Log our response
        self.conversation_history[conversation_id].append({"role": "agent", "content": response})
        logging.info(f"Responding to {conversation_id}: {response}")
        return response

    def _create_persona_response(self, conversation_id):
        """
        Selects a safe, curious question based on the sophistication of the scammer.
        """
        sophistication_data = self.sophistication_cache.get(conversation_id, {"score": 0.5, "category": "unknown"})
        score = sophistication_data["score"]
        category = sophistication_data["category"]
        
        logging.info(f"Selecting Persona for {conversation_id} - Score: {score} ({category})")

        # Select Persona
        if score < 0.4:
            # Low sophistication -> Use Naive Persona
            selected_persona = PERSONA["naive"]
            logging.info("Using Persona: NAIVE")
        elif score > 0.7:
             # High sophistication -> Use Skeptical Persona
            selected_persona = PERSONA["skeptical"]
            logging.info("Using Persona: SKEPTICAL")
        else:
             # Default/Average
            selected_persona = PERSONA["default"]
            logging.info("Using Persona: DEFAULT")
            
        return random.choice(selected_persona["safe_questions"])
