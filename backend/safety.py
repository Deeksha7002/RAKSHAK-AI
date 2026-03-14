import re
import logging
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
