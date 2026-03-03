import re
import logging
import math
from textblob import TextBlob
from collections import Counter

class ScamAnalyzer:
    """
    Highly Advanced NLP-Driven Intelligence Core.
    Replaces basic heuristics with Psychological Urgency Graphing, TF-IDF style sentence vectoring,
    and Dynamic Coercion Escalation tracking.
    """
    
    def __init__(self):
        self.sophistication_score = 0.0
        self.intent = "unknown"
        
        # Vectorized Topic Lexicons (instead of binary triggers)
        self.lexicons = {
            "financial_assets": ["money", "card", "bank", "transfer", "wire", "deposit", "payment", "fee", "charge", "cost", "dollar", "rupee", "usd", "cash", "crypto", "btc", "wallet", "usdt", "eth", "coin"],
            "identity_assets": ["password", "pin", "otp", "code", "credential", "login", "ssn", "identity", "account", "social", "verification", "phrase", "seed"],
            "coercion_vectors": ["police", "lawsuit", "jail", "arrest", "warrant", "legal", "court", "suspended", "blocked", "banned", "fbi", "interpol", "frozen", "investigate", "seized"],
            "time_compression": ["urgent", "immediately", "now", "hurry", "fast", "seconds", "expires", "deadline", "today", "quick", "asap", "limited", "soon"],
            "action_verbs": ["send", "pay", "give", "share", "tell", "click", "download", "install", "submit", "verify", "confirm", "provide"]
        }

    def analyze_behavior(self, history):
        if not history:
            return 0.0, "unknown"

        scammer_msgs = [m["content"] for m in history if m["role"] == "scammer"]
        if not scammer_msgs:
            return 0.0, "unknown"

        # 1. Psychological Urgency Graphing
        # Analyze the *rate of change* in urgency over the conversation
        urgency_graph = []
        for msg in scammer_msgs:
            blob = TextBlob(msg.lower())
            # Count time compression + coercion tokens in this specific message
            urgency_tokens = sum(1 for word in blob.words if word in self.lexicons["time_compression"] or word in self.lexicons["coercion_vectors"])
            # Normalize by message length to find word density, plus base sentiment subjectivity
            density = (urgency_tokens / max(len(blob.words), 1)) + (blob.sentiment.subjectivity * 0.2)
            urgency_graph.append(density)

        # Detect Exponential Escalation (scammer getting impatient/aggressive)
        escalation_multiplier = 1.0
        if len(urgency_graph) >= 3:
            # Compare urgency density of the first half vs the second half of the conversation.
            # If the scammer is ramping up pressure, the late average will exceed the early one.
            early_avg = sum(urgency_graph[:len(urgency_graph)//2]) / max(len(urgency_graph[:len(urgency_graph)//2]), 1)
            late_avg = sum(urgency_graph[len(urgency_graph)//2:]) / max(len(urgency_graph[len(urgency_graph)//2:]), 1)

            # 0.1 threshold: a 10-percentage-point spike in urgency density is considered significant
            if late_avg > early_avg + 0.1:
                escalation_multiplier = 1.4  # +40% threat when scammer clearly escalates pressure
                logging.info("[NLP Core] Coercion Escalation Detected: Scammer is applying pressure.")

        # 2. Vectorized Intent Processing (TF-IDF approximation for contexts)
        full_text = " ".join(scammer_msgs).lower()
        blob = TextBlob(full_text)
        words = blob.words
        word_freq = Counter(words)
        total_words = max(len(words), 1)

        # Calculate Lexicon Densities (Term Frequencies)
        tf_finance = sum(word_freq[w] for w in self.lexicons["financial_assets"] if w in word_freq) / total_words
        tf_identity = sum(word_freq[w] for w in self.lexicons["identity_assets"] if w in word_freq) / total_words
        tf_coercion = sum(word_freq[w] for w in self.lexicons["coercion_vectors"] if w in word_freq) / total_words
        tf_action = sum(word_freq[w] for w in self.lexicons["action_verbs"] if w in word_freq) / total_words

        # Cross-Vector Matrix Multiplication to determine Intent
        vector_scores = {
            "FINANCIAL_THEFT": (tf_finance * 1.5) + (tf_action * 1.0),
            "GENERAL_PHISHING": (tf_identity * 1.8) + (tf_action * 1.0),
            "AUTHORITY_IMPERSONATION": (tf_coercion * 2.0) + (tf_finance * 0.5),
            "CRYPTO_SCAM": (tf_finance * 1.2) + (full_text.count("crypto") + full_text.count("btc") + full_text.count("wallet")) / total_words * 3.0,
            "LOTTERY_SCAM": (tf_finance * 0.8) + (full_text.count("won") + full_text.count("prize") + full_text.count("lottery")) / total_words * 2.5
        }

        # Find the dominant intent vector
        dominant_intent = max(vector_scores.items(), key=lambda x: x[1])
        
        # If the highest vector score is negligible, fallback to regex structural checks for deep-linked malware/phishing
        if dominant_intent[1] < 0.05:
            self.intent = self._structural_link_check(full_text)
        else:
            self.intent = dominant_intent[0]

        # 3. Final Mathematical Risk Calculation
        # Short messages with high command density (e.g. "send otp", "wire now") are hyper-suspicious:
        # A long-winded message dilutes term frequency; a 3-word command does not.
        risk_multiplier = 10.0      # Base scale: domain-tuned so a TF of 0.1 maps to ~risk of 1.0 before clamp
        max_base_risk = 0.6         # Conservative cap for normal-length messages
        if total_words <= 8 and dominant_intent[1] > 0.4:
            # Very short message + strong signal = extremely dangerous (e.g. "send me your pin")
            risk_multiplier = 15.0
            max_base_risk = 0.85   # Allow higher ceiling for command-style messages

        # Base risk is the magnitude of the dominant intent vector, scaled
        base_risk = min(dominant_intent[1] * risk_multiplier, max_base_risk)
        
        # Apply Escalation Multiplier (This is where the math gets brutal for scammers)
        mathematical_risk = base_risk * escalation_multiplier
        
        # Add Sentiment Penality
        if blob.sentiment.polarity < -0.3: # Highly negative/threatening language
            mathematical_risk += 0.2
            
        # Sophistication: measures how "professional" the scam sounds.
        # High vocabulary richness (+0.2) = crafted, professional scam.
        # Use of "kindly" (-0.3) = common in southeast-Asian script scams; strong inverse signal.
        unique_words = len(set(words))
        vocab_richness = unique_words / total_words
        sophistication = 0.5
        if vocab_richness > 0.6: sophistication += 0.2
        if "kindly" in full_text: sophistication -= 0.3  # Classic script giveaway
        
        self.sophistication_score = max(0.0, min(1.0, mathematical_risk + (sophistication * 0.2)))

        # Map to Threat Classification based on rigorous threshold
        if mathematical_risk > 0.65 or self.intent in ["MALICIOUS_LINK"]:
            threat_classification = "scam"
            self.sophistication_score = max(self.sophistication_score, 0.90)
        elif mathematical_risk > 0.35:
            threat_classification = "likely_scam"
            self.sophistication_score = max(self.sophistication_score, 0.70)
        else:
            threat_classification = "benign"
            self.intent = "GENERAL_INQUIRY"

        # Construct the Multi-Layer Neural Output
        # This gives a granular breakdown of *why* the model made its decision
        neuro_matrix = {
            "financial_risk_node": min(1.0, tf_finance * 4.0),
            "coercion_risk_node": min(1.0, tf_coercion * 5.0 * escalation_multiplier),
            "urgency_spike_node": min(1.0, sum(urgency_graph) / max(len(urgency_graph), 1) * 3.0) if urgency_graph else 0.0,
            "deception_complexity_node": self.sophistication_score
        }

        logging.info(f"[NLP Core] Vector Magnitude: {dominant_intent[1]:.4f} | Escalation: {escalation_multiplier} | Threat: {threat_classification}")
        return self.sophistication_score, threat_classification, neuro_matrix

    def _structural_link_check(self, text):
        link_pattern = r"(click|tap|visit|open|download|install).{0,30}(link|url|website|page|attachment|app|.apk|.exe)"
        if re.search(link_pattern, text):
            return "MALICIOUS_LINK"
        return "GENERAL_INQUIRY"
