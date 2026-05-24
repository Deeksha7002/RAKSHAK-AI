import re
import logging
import hashlib
import secrets
from config import SENSITIVE_PATTERNS, UNSAFE_KEYWORDS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [SAFETY] - %(message)s')

class SafetyGuard:
    @staticmethod
    def redact_pii(text, exclude_values=None):
        """
        Scans text for sensitive patterns and replaces them with [REDACTED: <TYPE>].
        Optional: exclude_values list will NOT be redacted even if they match patterns.
        """
        if not text:
            return ""
        redacted_text = text
        exclude_list = exclude_values or []
        
        for pii_type, pattern in SENSITIVE_PATTERNS.items():
            matches = re.findall(pattern, redacted_text)
            for match in matches:
                # Handle tuple matches from complex regex
                if isinstance(match, tuple):
                    match_str = "".join([m for m in match if m])
                else:
                    match_str = match
                
                if not match_str:
                    continue
                
                # Check if this match is in the exclude list (case-insensitive check for IDs etc)
                if any(match_str.lower() == str(exc).lower() for exc in exclude_list):
                    continue
                    
                redacted_text = redacted_text.replace(match_str, f"[REDACTED: {pii_type}]")
        
        return redacted_text

    @staticmethod
    def check_policy(response_text):
        """
        Checks if the generated response violates safety policies 
        (e.g., promising money, asking for passwords).
        Returns True if safe, False if unsafe.
        """
        response_lower = response_text.lower()
        for keyword in UNSAFE_KEYWORDS:
            if keyword in response_lower:
                logging.warning(f"Policy Violation Detected! Found forbidden keyword: '{keyword}'")
                return False
        return True


class DecoyProxyManager:
    """
    Highly advanced Real-Time Decoy & Anonymization Relaying Gateway.
    Protects user privacy by intercepting raw messages in RAM, mapping real PII 
    to synthetic high-fidelity baits, and translating them transparently back-and-forth.
    """
    def __init__(self):
        # In-memory session store (acts as our ephemeral Redis database)
        self.active_sessions = {}
        # Cryptographic salt for deterministic anonymization
        self.salt = secrets.token_hex(16)

    def get_or_create_decoy_session(self, real_user_id: str) -> dict:
        """
        Ensures an active session has a secure decoy map.
        Generates realistic decoy credentials to feed scammers as active bait.
        """
        if real_user_id in self.active_sessions:
            return self.active_sessions[real_user_id]

        # 1. Deterministic but non-reversible cryptographic hash for User ID
        hasher = hashlib.sha256()
        hasher.update(f"{real_user_id}-{self.salt}".encode('utf-8'))
        anonymized_id = f"ANON-{hasher.hexdigest()[:12].upper()}"

        # 2. Synthesize highly realistic decoy data (Baits)
        decoy_data = {
            "anonymized_id": anonymized_id,
            "real_pii": {}, # Will store user's actual entered PII when dynamically intercepted
            "decoy_pii": {
                "PHONE": f"+1 (555) {secrets.randbelow(900) + 100}-{secrets.randbelow(9000) + 1000}",
                "EMAIL": f"bait.operator.{secrets.token_hex(4)}@secure-trap.org",
                "CREDIT_CARD": f"4111 {secrets.randbelow(9000) + 1000} {secrets.randbelow(9000) + 1000} {secrets.randbelow(9000) + 1000}",
                "SSN": f"999-{secrets.randbelow(90) + 10}-{secrets.randbelow(9000) + 1000}"
            }
        }
        
        self.active_sessions[real_user_id] = decoy_data
        logging.info(f"🛡️ SECURE PROXY: Initialized anonymous session mapping: {real_user_id} -> {anonymized_id}")
        return decoy_data

    def sanitize_inbound_message(self, real_user_id: str, text: str) -> str:
        """
        [USER -> SCAMMER]
        Intercepts incoming message in RAM, discovers any real PII, saves it locally, 
        and replaces it with realistic baits before sending it to the scammer.
        """
        if not text:
            return ""
            
        session = self.get_or_create_decoy_session(real_user_id)
        sanitized_text = text

        for pii_type, pattern in SENSITIVE_PATTERNS.items():
            matches = re.findall(pattern, sanitized_text)
            for match in matches:
                # Resolve match strings
                if isinstance(match, tuple):
                    match_str = "".join([m for m in match if m])
                else:
                    match_str = match

                if not match_str or match_str in session["decoy_pii"].values():
                    continue

                # 1. Capture the real PII and lock it inside the secure proxy RAM
                session["real_pii"][pii_type] = match_str
                
                # 2. Pull the decoy bait value
                decoy_value = session["decoy_pii"].get(pii_type, f"[DECOY_{pii_type}]")
                
                # 3. Swap user's real PII with the decoy value
                sanitized_text = sanitized_text.replace(match_str, decoy_value)
                logging.info(f"🔄 DECOY INJECTED: Intercepted raw {pii_type}. Swapped with bait credential.")

        return sanitized_text

    def translate_outbound_message(self, real_user_id: str, text: str) -> str:
        """
        [SCAMMER -> USER]
        Intercepts the scammer's response in RAM. If the scammer references any of 
        our baits (e.g. 'I charged 4999...'), it swaps it back to the user's real PII 
        so the victim experiences a natural, transparent conversation interface.
        """
        if not text:
            return ""
            
        session = self.get_or_create_decoy_session(real_user_id)
        translated_text = text

        # Swap decoy values back with real PII values in RAM before displaying to user
        for pii_type, decoy_val in session["decoy_pii"].items():
            real_val = session["real_pii"].get(pii_type)
            if real_val and decoy_val in translated_text:
                translated_text = translated_text.replace(decoy_val, real_val)
                logging.info(f"🔀 DECOY TRANSLATED BACK: Relayed scammer's mention of {pii_type} to user context.")

        return translated_text

    def purge_session(self, real_user_id: str):
        """
        Completely purges session mapping from RAM, performing memory garbage collection.
        Leaves absolutely zero traces on disk.
        """
        if real_user_id in self.active_sessions:
            del self.active_sessions[real_user_id]
            logging.info(f"🧹 SECURE PROXY: Ephemeral RAM session purged for {real_user_id}.")


# Global Instance of the secure Decoy Relaying Gateway
decoy_gateway = DecoyProxyManager()

