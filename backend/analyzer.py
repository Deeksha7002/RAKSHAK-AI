import re
import logging
import math
from collections import Counter
from textblob import TextBlob
try:
    import nltk
    nltk.download('punkt', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
except ImportError:
    logging.warning("⚠️ nltk package not installed. Sophisticated NLP features may be limited.")
except Exception as e:
    logging.warning(f"⚠️ NLTK download failed: {e}")

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
            "financial_assets": ["money", "card", "bank", "transfer", "wire", "deposit", "payment", "fee", "charge", "cost", "dollar", "rupee", "usd", "cash", "crypto", "btc", "wallet", "usdt", "eth", "coin", "salary", "income", "profit", "earnings", "commission", "payout", "bonus", "earn", "daily", "monthly", "tax", "refund", "unpaid", "overdue", "bill", "invoice"],
            "identity_assets": ["password", "pin", "otp", "code", "credential", "login", "ssn", "identity", "account", "social", "verification", "phrase", "seed", "document", "passport", "license"],
            "coercion_vectors": ["police", "lawsuit", "jail", "arrest", "warrant", "legal", "court", "suspended", "blocked", "banned", "fbi", "interpol", "frozen", "investigate", "seized", "prosecution", "penalty", "enforcement", "federal"],
            "time_compression": ["urgent", "immediately", "now", "hurry", "fast", "seconds", "expires", "deadline", "today", "quick", "asap", "limited", "soon", "daily", "instantly", "part-time", "final notice", "urgent notice", "last chance"],
            "action_verbs": ["send", "pay", "give", "share", "tell", "click", "download", "install", "submit", "verify", "confirm", "provide", "earn", "receive", "withdraw", "claim", "apply"],
            # ── NEW: Tech Support Scam Vectors ──────────────────────────────────
            "tech_threat": ["virus", "malware", "hacked", "infected", "detected", "breach", "compromised", "trojan", "spyware", "ransomware", "threat", "attack", "warning", "alert", "error", "critical", "dangerous", "suspicious", "unauthorized", "blocked"],
            "tech_action": ["remote", "access", "teamviewer", "anydesk", "support", "technician", "engineer", "helpdesk", "call", "contact", "fix", "repair", "scan", "remove", "protect", "secure", "update", "enable", "disable"],
            "impersonation": ["microsoft", "apple", "google", "amazon", "paypal", "netflix", "bank", "government", "irs", "tax", "customs", "helpline", "official", "support", "service", "department", "authority", "police", "social security", "treasury", "revenue"]
        }

        # ── Instant-Flag Patterns (regex): Always flag these regardless of score ─
        # These are the most common tech support scam openers — single-message kills
        self.instant_flag_patterns = [
            # Tech Support / Virus Alert
            r"(detected|found|identified).{0,30}(virus|malware|threat|breach|hack|trojan|infected)",
            r"(virus|malware|threat).{0,30}(detected|found|computer|device|windows|mac|phone)",
            r"your (computer|device|pc|mac|windows|system).{0,30}(infected|hacked|virus|hack|breach|compromise)",
            r"(microsoft|apple|google|amazon|coinbase|paypal|netflix|binance|meta|instagram|facebook|whatsapp|uber|bank).{0,20}(support|helpdesk|service|team|official|alert|warning)",
            r"(call|contact).{0,20}(support|helpline|toll.?free|number).{0,20}(immediately|now|urgent|asap)",
            r"(remote|access|anydesk|teamviewer|ultraviewer).{0,20}(computer|device|pc|system)",
            r"your (subscription|account|membership).{0,20}(expired|suspend|blocked|charged)",
            # ── Account Compromise / Hacking ──────────────────────────────────
            r"your account.{0,30}(compromised|hacked|breached|stolen|unauthorized|suspend|blocked|frozen|terminated|banned)",
            r"account (has been|was|is|have been).{0,20}(compromised|hacked|breached|suspended|blocked|frozen|unauthorized)",
            r"(unauthorized|suspicious).{0,20}(access|activity|login|transaction|attempt).{0,20}(your|on|detected|found)",
            r"(suspicious|unusual).{0,20}(activity|login|transaction|access).{0,20}(detected|found|noticed|identified)",
            r"we.{0,10}(detected|noticed|identified|found).{0,20}(suspicious|unauthorized|unusual|illegal).{0,20}(activity|access|login|attempt)",
            r"(security|account).{0,20}(alert|warning|notification|breach|issue|problem|compromised)",
            # ── Brand Impersonation Openers ───────────────────────────────────
            r"(this is|from|calling from|team from|official from).{0,20}(microsoft|apple|google|amazon|coinbase|paypal|netflix|binance|your bank|support team|irs|social security|treasury)",
            r"(microsoft|apple|google|amazon|coinbase|paypal|netflix|binance|visa|mastercard|irs|social security).{0,10}(has detected|detected|has identified|is alerting|security team|fraud team|revenue service)",
            # ── NEW: Tax / Government / Authority Scams ───────────────────────
            r"(irs|tax|social security|ssn|customs|fbi|police|department|treasury|revenue).{0,30}(notice|alert|warning|unpaid|overdue|suspended|final|warrant|penalty)",
            r"(final notice|urgent notice).{0,30}(unpaid|tax|bill|invoice|payment|account|money)",
            r"unpaid (tax|taxes|bill|invoice|penalty).{0,20}(of|amounting).{0,10}(\$|rs|usd|rupees)",
            r"your (ssn|social security number|identity).{0,20}(suspended|blocked|used|compromised|stolen)",
            # Prize / Lottery
            r"(won|win|winner|selected|chosen).{0,30}(prize|lottery|award|reward|gift|cash)",
            r"(claim|collect).{0,30}(prize|reward|winning|amount|money)",
            # KYC / Account Suspension  
            r"(kyc|account|service).{0,20}(suspend|block|terminate|close).{0,20}(immedi|now|today|hour)",
            r"update your (kyc|information|details|account).{0,20}(immedi|now|or|else|suspend)",
            # OTP / Credential Harvesting
            r"(share|send|provide|give).{0,20}(otp|pin|password|code|credential|cvv|card number)",
            r"(do not share|never share).{0,20}(otp|pin|code).{0,10}(anyone|team|support|us)",
            # ── Job / Earning Scams ──────────────────────────────────────────
            r"(earn|make).{0,20}(\$|rs|income|salary|money).{0,20}(daily|today|day|week|month).{0,20}(job|work|task)",
            r"(part.time|online|home).{0,10}(job|work|task).{0,20}(earn|salary|income)",
        ]

    def analyze(self, text, context="general", sender_name=""):
        """
        Convenience wrapper for single-message analysis.
        sender_name: pass the scammer's display name or subject line so the analyzer
        can catch brand-impersonation even when the body alone is short.
        """
        # Prepend sender_name so impersonation patterns fire on e.g. "CoinBase Support"
        enriched = f"{sender_name} {text}".strip() if sender_name else text
        score, category, matrix, llm_needed = self.analyze_behavior([{"role": "scammer", "content": enriched}])
        # Extra basic IOCs for the frontend Threat Lab
        iocs = []
        if "bit.ly" in text or "http" in text:
            iocs.append("Suspicious URL")
        if re.search(r'\b(?:\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', text):
            iocs.append("Phone Number")
        if "@" in text and "." in text:
            iocs.append("Email Address")
        if re.search(r'\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b', text):
            iocs.append("Bitcoin Address")
            
        return {
            "risk_score": score,
            "classification": category,
            "neural_matrix": matrix,
            "llm_verification_required": llm_needed,
            "intent": self.intent,
            "iocs": iocs
        }

    def analyze_behavior(self, history):
        self.intent = "unknown"
        if not history:
            return 0.0, "benign", {}, False

        scammer_msgs = [m["content"] if m["content"] is not None else "" for m in history if m["role"] == "scammer"]
        if not scammer_msgs or not any(scammer_msgs):
            return 0.0, "benign", {}, False

        # ── INSTANT FLAG CHECK: Pattern-Match Known Scam Openers ──────────────
        full_text_check = " ".join(scammer_msgs).lower()
        for pattern in self.instant_flag_patterns:
            if re.search(pattern, full_text_check, re.IGNORECASE):
                logging.warning(f"[NLP Core] ⚠️ INSTANT FLAG: '{pattern}' matched. Auto-classifying as SCAM.")
                neuro_matrix = {
                    "financial_risk_node": 0.6,
                    "coercion_risk_node": 0.9,
                    "urgency_spike_node": 0.8,
                    "deception_complexity_node": 0.95
                }
                self.intent = "TECH_SUPPORT_SCAM" if any(w in full_text_check for w in ["virus", "microsoft", "computer", "hack", "detected"]) else "SCAM_DETECTED"
                return 0.95, "scam", neuro_matrix, False

        # 1. Psychological Urgency Graphing
        # Analyze the *rate of change* in urgency over the conversation
        urgency_graph = []
        for msg in scammer_msgs:
            blob = TextBlob(msg.lower())
            # Safely handle words list
            words = blob.words if blob.words is not None else []
            # Count time compression + coercion tokens in this specific message
            urgency_tokens = sum(1 for word in words if word in self.lexicons["time_compression"] or word in self.lexicons["coercion_vectors"])
            # Normalize by message length to find word density, plus base sentiment subjectivity
            density = (urgency_tokens / max(len(words), 1)) + (blob.sentiment.subjectivity * 0.2)
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
        words = blob.words if blob.words is not None else []
        word_freq = Counter(words)
        total_words = max(len(words), 1)

        # Calculate Lexicon Densities (Term Frequencies)
        tf_finance = sum(word_freq[w] for w in self.lexicons["financial_assets"] if w in word_freq) / total_words
        tf_identity = sum(word_freq[w] for w in self.lexicons["identity_assets"] if w in word_freq) / total_words
        tf_coercion = sum(word_freq[w] for w in self.lexicons["coercion_vectors"] if w in word_freq) / total_words
        tf_action = sum(word_freq[w] for w in self.lexicons["action_verbs"] if w in word_freq) / total_words

        # Term Frequencies for NEW lexicons
        tf_tech_threat = sum(word_freq[w] for w in self.lexicons["tech_threat"] if w in word_freq) / total_words
        tf_tech_action = sum(word_freq[w] for w in self.lexicons["tech_action"] if w in word_freq) / total_words
        tf_impersonation = sum(word_freq[w] for w in self.lexicons["impersonation"] if w in word_freq) / total_words

        # Cross-Vector Matrix Multiplication to determine Intent
        vector_scores = {
            "FINANCIAL_THEFT": (tf_finance * 1.5) + (tf_action * 1.0),
            "GENERAL_PHISHING": (tf_identity * 1.8) + (tf_action * 1.0),
            "AUTHORITY_IMPERSONATION": (tf_coercion * 2.0) + (tf_finance * 0.5),
            "CRYPTO_SCAM": (tf_finance * 1.2) + (full_text.count("crypto") + full_text.count("btc") + full_text.count("wallet")) / total_words * 3.0,
            "LOTTERY_SCAM": (tf_finance * 0.8) + (full_text.count("won") + full_text.count("prize") + full_text.count("lottery")) / total_words * 2.5,
            "JOB_SCAM": (tf_finance * 1.0) + (full_text.count("work") + full_text.count("earn") + full_text.count("home") + full_text.count("job") + full_text.count("salary")) / total_words * 4.0,
            # ── NEW VECTORS ──────────────────────────────────────
            "TECH_SUPPORT_SCAM": (tf_tech_threat * 2.5) + (tf_tech_action * 1.5) + (tf_impersonation * 1.0),
            "BRAND_IMPERSONATION": (tf_impersonation * 3.0) + (tf_tech_action * 0.5) + (tf_coercion * 0.5),
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
        
        # Override: If intent signal is exceptionally high, ignore the word-count cap
        if dominant_intent[1] > 0.8:
            base_risk = max(base_risk, 0.75)
        
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
        
        # Determine if we need a second-pass verification via LLM
        # Cases in the "likely_scam" (Yellow) range need the LLM's opinion.
        llm_verification_required = (threat_classification == "likely_scam")
        
        return self.sophistication_score, threat_classification, neuro_matrix, llm_verification_required

    def _structural_link_check(self, text):
        link_pattern = r"(click|tap|visit|open|download|install).{0,30}(link|url|website|page|attachment|app|.apk|.exe)"
        if re.search(link_pattern, text):
            return "MALICIOUS_LINK"
        return "GENERAL_INQUIRY"
