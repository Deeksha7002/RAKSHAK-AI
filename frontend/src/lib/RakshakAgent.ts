import { RESPONSE_TEMPLATES } from './config';
import type { PersonaType } from './config';
import { SafetyGuard } from './Safety';
import { BaitGenerator } from './BaitGenerator';
import { ScamAnalyzer } from './ScamAnalyzer';
import { CyberCellService } from './CyberCellService';
import { API_BASE_URL } from './config';
import type { Classification, Message, IncidentReport, IOCs, ScamType } from './types';

export class RakshakAgent {
    private iocs: IOCs = {
        urls: [],
        domains: [],
        paymentMethods: [],
        sensitiveDataRedacted: 0
    };

    // Track the highest threat level observed in the current conversation
    private maxThreatLevel: Classification = 'benign';
    private currentScamType: ScamType = 'OTHER';
    private analyzer = new ScamAnalyzer();
    private conversationHistory: Message[] = [];

    // Current Persona state
    public currentPersona: PersonaType = 'ELDERLY';
    public senderName: string = 'Unknown';

    // Track if already reported to avoid duplicates
    private hasAutoReported: boolean = false;

    public isIntelligenceSufficient(): boolean {
        const iocCount = this.iocs.urls.length + this.iocs.paymentMethods.length + this.iocs.domains.length;
        // Sufficient if we have at least one malicious URL OR one payment method
        return iocCount > 0 && (this.iocs.urls.length > 0 || this.iocs.paymentMethods.length > 0);
    }

    private detectScamType(text: string): ScamType {
        const lower = text.toLowerCase();
        if (lower.match(/(crypto|bitcoin|eth|wallet|binance|coinbase|investment|yield|profit)/)) return 'CRYPTO';
        if (lower.match(/(job|work from home|salary|recruit|hiring|task|telegram task)/)) return 'JOB';
        if (lower.match(/(love|dear|sweet|honey|romantic|meeting|lonely)/)) return 'ROMANCE';
        if (lower.match(/(irs|police|warrant|arrest|jail|federal|tax|violation)/)) return 'AUTHORITY';
        if (lower.match(/(support|hacked|virus|microsoft|anydesk|teamviewer)/)) return 'TECHNICAL_SUPPORT';
        if (lower.match(/(prize|winner|lottery|won|jackpot|congratulations)/)) return 'LOTTERY';
        if (lower.match(/(impersonat|mom|dad|son|daughter|family|friend|urgent favor)/)) return 'IMPERSONATION';
        return 'OTHER';
    }

    ingest(text: string, conversationId: string, relationalContext?: 'family' | 'work' | 'friend'): { classification: Classification, safeText: string, intent: string, score: number, isCompromised: boolean, autoReported: boolean, missionComplete: boolean, scamType: ScamType, iocs: string[] } {
        // 1. Redact
        const safeText = SafetyGuard.redactPII(text);
        if (safeText !== text) {
            this.iocs.sensitiveDataRedacted++;
        }

        // Add to history
        this.conversationHistory.push({
            id: Date.now().toString(),
            sender: 'scammer',
            content: safeText,
            timestamp: Date.now()
        });

        // 2. Classify & Extract IOCs
        const currentClassification = this.classify(text);
        this.extractIOCs(text);

        // 3. NLP analysis — run ONCE and share result (avoids duplicate call in checkForPersonaSwitch)
        const { score } = this.analyzer.analyzeBehavior(this.conversationHistory);

        // 4. Adaptive Persona Switching — reuse the score we already computed
        this.checkForPersonaSwitch(text, score);

        // 5. Update State (Threat Level Ratchet)
        if (currentClassification === 'scam') {
            this.maxThreatLevel = 'scam';
        } else if (currentClassification === 'likely_scam' && this.maxThreatLevel !== 'scam') {
            this.maxThreatLevel = 'likely_scam';
        }

        // 6. Intent Detection
        const intent = this.detectIntent(text);

        // 7. Contextual Anomaly Detection
        const isCompromised = this.detectCompromise(text, relationalContext);
        if (isCompromised) {
            this.maxThreatLevel = 'scam';
        }

        // 8. Heuristic Score Override — NLP can upgrade classification even if keywords missed it
        if (score >= 0.85 && this.maxThreatLevel !== 'scam') {
            this.maxThreatLevel = 'scam';
        } else if (score >= 0.6 && this.maxThreatLevel === 'benign') {
            this.maxThreatLevel = 'likely_scam';
        }

        if (this.maxThreatLevel === 'scam' && !this.hasAutoReported) {
            this.hasAutoReported = true;
            const report = this.getReport(conversationId, this.maxThreatLevel, [...this.conversationHistory]);
            CyberCellService.autoReport(report);
        }

        console.log(`[RakshakAgent] Ingest Complete. Class: ${this.maxThreatLevel}, Reported: ${this.hasAutoReported}, Intent: ${intent}`);

        if (currentClassification === 'scam' || currentClassification === 'likely_scam') {
            this.currentScamType = this.detectScamType(text);
        }
        return {
            classification: this.maxThreatLevel,
            safeText,
            intent,
            score: Math.round(score * 100),
            isCompromised,
            autoReported: this.hasAutoReported,
            missionComplete: this.isIntelligenceSufficient(),
            scamType: this.currentScamType,
            iocs: [...this.iocs.urls, ...this.iocs.paymentMethods]
        };
    }

    private detectCompromise(text: string, context?: 'family' | 'work' | 'friend'): boolean {
        if (!context) return false;
        const lower = text.toLowerCase();

        if (context === 'family') {
            // High trust but never business/urgent financial
            const forbiddenKeywords = ['gift card', 'crypto', 'bitcoin', 'investment', 'urgent', 'wire transfer', 'bail', 'jail', 'verify', 'password'];
            return forbiddenKeywords.some(kw => lower.includes(kw));
        }

        if (context === 'work') {
            // Professional but never personal financial/security via informal channels
            // Added 'urgent invoice' and 'login' to catch the Sarah scenario
            const forbiddenKeywords = ['gift card', 'steam', 'itunes', 'personal info', 'password', 'credit card', 'banking', 'urgent favor', 'urgent invoice', 'login'];
            return forbiddenKeywords.some(kw => lower.includes(kw));
        }

        return false;
    }

    // score is passed in from ingest() to avoid a redundant analyzeBehavior() call
    private checkForPersonaSwitch(text: string, score: number) {
        // 1. High-sophistication scammer → deploy skeptical SysAdmin persona
        if (score > 0.7) {
            if (this.currentPersona !== 'SKEPTICAL') {
                console.log(`[Persona Switch] ${this.currentPersona} -> SKEPTICAL (High Sophistication score: ${score.toFixed(2)})`);
                this.currentPersona = 'SKEPTICAL';
            }
            return;
        }

        const lower = text.toLowerCase();

        // 2. Topic-based persona triggers (only if threat isn't high enough for SKEPTICAL)
        if (lower.match(/(bitcoin|crypto|invest|yield|profit|usdt|binance|coinbase)/)) {
            if (this.currentPersona !== 'INVESTOR') {
                console.log(`[Persona Switch] ${this.currentPersona} -> INVESTOR (crypto keywords detected)`);
                this.currentPersona = 'INVESTOR';
            }
        } else if (lower.match(/(police|warrant|arrest|irs|federal|jail|legal|court)/)) {
            if (this.currentPersona !== 'CITIZEN') {
                console.log(`[Persona Switch] ${this.currentPersona} -> CITIZEN (authority keywords detected)`);
                this.currentPersona = 'CITIZEN';
            }
        } else if (score < 0.4 && this.currentPersona !== 'ELDERLY') {
            // Low-threat, unrecognised pattern → confused elderly persona wastes the most time
            console.log(`[Persona Switch] ${this.currentPersona} -> ELDERLY (low threat score: ${score.toFixed(2)})`);
            this.currentPersona = 'ELDERLY';
        }
    }

    // Make public for UI to use if needed, though most comes through ingest now
    public getThreatMetrics() {
        return {
            maxThreatLevel: this.maxThreatLevel,
            activePersona: this.currentPersona,
            iocsCaptured: this.iocs.urls.length + this.iocs.paymentMethods.length + this.iocs.domains.length
        };
    }

    /**
     * Keyword-level classifier — intentionally conservative to avoid false positives.
     * Single generic words ("code", "account", "support") are NOT enough on their own.
     * Requires either:
     *   a) A scam-specific COMPOUND phrase, OR
     *   b) A financial artifact (crypto address / UPI / suspicious URL pattern)
     * The NLP score from analyzeBehavior() is the primary signal; this is a fast pre-filter.
     */
    private classify(text: string): Classification {
        const lower = text.toLowerCase();

        // Tier 1 — unambiguous scam compound phrases
        const scamPhrases = [
            // Phishing / credential harvesting
            "verify your account", "confirm your identity", "share your otp",
            "enter your pin", "provide your password", "share your password",
            "send your otp", "give me the code",
            // Financial theft
            "send money", "wire transfer", "send bitcoin", "send usdt",
            "send crypto", "send eth", "deposit now", "transfer funds",
            "private key", "seed phrase", "wallet address",
            // Authority impersonation
            "arrest warrant", "legal action will", "irs agent", "federal warrant",
            "suspended your account", "account has been frozen",
            // ── Tech Support & Impersonation (ADDED) ──────────────────────────
            "your computer is infected", "call microsoft", "download anydesk",
            "download teamviewer", "remote access",
            "account has been compromised", "account was compromised",
            "your account has been hacked", "your device has been compromised",
            "we have detected a virus", "virus has been detected",
            "detected a virus on your", "detected on your computer",
            "detected on your device", "your system is at risk",
            "microsoft support", "apple support", "coinbase support",
            "google support", "amazon support", "paypal support",
            "tech support", "call our helpline",
            "call our support", "contact our support",
            "unauthorized access", "suspicious activity detected",
            "your account will be suspended", "your account will be blocked",
            "your account will be terminated", "complete your kyc",
            "update your kyc", "kyc verification required",
            "your subscription has expired", "your subscription has been suspended",
            // Lottery / advance-fee
            "claim your prize", "you have won", "lottery winner", "claim reward",
            "release fee", "processing fee", "advance fee",
            // Work from home / recruitment scams
            "work from home", "earn money", "daily income", "part time job",
            "weekly salary", "earn extra", "online task", "telegram task",
            "earn $", "earn rs", "salary of", "job offer",
        ];

        if (scamPhrases.some(phrase => lower.includes(phrase))) return 'scam';

        // Tier 2 — high-confidence single tokens (unambiguous in any context)
        const strongSingleTokens = [
            "upi", "btc", "usdt", "bc1",   // payment artifacts
            "0x",                             // ETH address prefix
        ];
        if (strongSingleTokens.some(kw => lower.includes(kw))) return 'scam';

        // Tier 3 — suspicious URL patterns
        if (/https?:\/\//.test(lower) || /\.(?:xyz|tk|ml|ga|cf|gq)(\b|\/|$)/.test(lower)) return 'likely_scam';
        if (lower.includes(".com") && (lower.includes("click") || lower.includes("verify"))) return 'likely_scam';

        return 'benign';
    }


    private extractIOCs(text: string) {
        // Regex for URLs (http, https, www)
        const urlRegex = /((https?:\/\/)|(www\.))[^\s]+/gi;
        const urls = text.match(urlRegex);
        if (urls) {
            this.iocs.urls.push(...urls);
            urls.forEach(url => {
                try {
                    let urlToParse = url;
                    if (url.startsWith('www.')) {
                        urlToParse = 'https://' + url;
                    }
                    const domain = new URL(urlToParse).hostname;
                    if (!this.iocs.domains.includes(domain)) {
                        this.iocs.domains.push(domain);
                    }
                } catch (e) { /* ignore invalid urls */ }
            });
        }

        // UPI IDs (e.g., example@oksbi)
        const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
        const upis = text.match(upiRegex);
        if (upis) {
            upis.forEach(upi => {
                if (!this.iocs.paymentMethods.includes(upi)) {
                    this.iocs.paymentMethods.push(upi);
                }
            });
        }

        // Crypto Wallets (BTC/ETH)
        const btcRegex = /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/g;
        const ethRegex = /\b0x[a-fA-F0-9]{40}\b/g;

        const wallets = [...(text.match(btcRegex) || []), ...(text.match(ethRegex) || [])];
        wallets.forEach(w => {
            if (!this.iocs.paymentMethods.includes(w)) {
                this.iocs.paymentMethods.push(w);
            }
        });

        // Keywords for other payment methods
        const paymentKeywords = ["bitcoin", "ethereum", "google play", "gift card", "western union", "wire transfer", "zelle", "cashapp", "bank transfer", "account number", "ifsc"];
        paymentKeywords.forEach(pm => {
            if (text.toLowerCase().includes(pm) && !this.iocs.paymentMethods.includes(pm)) {
                this.iocs.paymentMethods.push(pm);
            }
        });
    }

    // Track the last response to avoid repetition
    private lastResponse: string | null = null;

    private detectIntent(text: string): string {
        const lower = text.toLowerCase();

        // Priority 0: Greetings (Start of convo or re-engagement)
        if (lower.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
            return "GREETING";
        }

        // Priority 1: Money/Payment (Inject Bait)
        if (lower.includes("pay") || lower.includes("card") || lower.includes("bank") || lower.includes("money") || lower.includes("details")) {
            return "MONEY";
        }

        // Priority 2: Codes (Inject Bait)
        if (lower.includes("code") || lower.includes("verify") || lower.includes("pin") || lower.includes("otp")) {
            return "CODES";
        }

        // Priority 3: Links (Stall)
        if (lower.includes("http") || lower.includes("click") || lower.includes("link") || lower.includes("website")) {
            return "LINKS";
        }

        // Priority 4: Urgency (Stall)
        if (lower.includes("urgent") || lower.includes("now") || lower.includes("hurry") || lower.includes("fast") || lower.includes("asap")) {
            return "URGENCY";
        }

        // Priority 5: Questions (General stalling)
        if (lower.includes("?") || lower.includes("are you") || lower.includes("can you")) {
            return "QUESTION";
        }

        return "GENERAL";
    }

    // ── LLM-powered response via backend ──────────────────────────────────────
    async generateResponse(classification: Classification, incomingText?: string): Promise<string | null> {
        if (classification === 'benign') {
            const neutralResponses = [
                "Who is this?",
                "I think you have the wrong number.",
                "Sorry, do I know you?"
            ];
            return neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
        }

        // Map TS persona names → backend persona names
        const personaMap: Record<PersonaType, string> = {
            'ELDERLY': 'naive',
            'SKEPTICAL': 'skeptical',
            'INVESTOR': 'default',
            'CITIZEN': 'default',
        };
        const backendPersona = personaMap[this.currentPersona] ?? 'default';

        // Build conversation history for LLM context (last 10 turns)
        const historyForLLM = this.conversationHistory.slice(-10).map(m => ({
            role: m.sender === 'scammer' ? 'scammer' : 'agent',
            content: m.content
        }));

        // ── Try LLM endpoint ─────────────────────────────────────────────────
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5s hard timeout

            const res = await fetch(`${API_BASE_URL}/api/generate-response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Rakshak-Token': 'rakshak-core-v1'
                },
                body: JSON.stringify({
                    message: incomingText ?? '',
                    sender_name: this.senderName,
                    persona: backendPersona,
                    conversation_history: historyForLLM,
                    classification
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                if (data.response) {
                    console.log(`✨ [Groq LLM] Response received (persona: ${backendPersona})`);
                    this.lastResponse = data.response;
                    this.conversationHistory.push({
                        id: Date.now().toString(),
                        sender: 'agent',
                        content: data.response,
                        timestamp: Date.now()
                    });
                    return data.response;
                }
            }
        } catch (e) {
            console.warn('⚠️ [Groq LLM] API call failed or timed out, using static fallback.', e);
        }

        // ── Static fallback (existing logic) ─────────────────────────────────
        let category = "GENERAL";
        if (incomingText) {
            const intent = this.detectIntent(incomingText);
            if (intent) category = intent;
        }

        const personaTemplates = RESPONSE_TEMPLATES[this.currentPersona] as Record<string, string[]>;
        const templates = personaTemplates[category] || personaTemplates["GENERAL"];

        let response = templates[Math.floor(Math.random() * templates.length)];
        if (response === this.lastResponse && templates.length > 1) {
            response = templates[Math.floor(Math.random() * templates.length)];
        }
        this.lastResponse = response;

        // Inject Bait
        if (response.includes("{credit_card}")) response = response.replace("{credit_card}", BaitGenerator.generateFakeCard());
        if (response.includes("{password}")) response = response.replace("{password}", BaitGenerator.generateFakePassword());
        if (response.includes("{otp}")) response = response.replace("{otp}", BaitGenerator.generateFakeOTP());

        return response;
    }

    getReport(conversationId: string, _classification: Classification, transcript: Message[]): IncidentReport {
        return {
            conversationId,
            classification: this.currentScamType !== 'OTHER' ? this.currentScamType : this.maxThreatLevel,
            confidenceScore: this.maxThreatLevel === 'scam' ? 0.95 : this.maxThreatLevel === 'likely_scam' ? 0.75 : 0.1,
            iocs: { ...this.iocs },
            transcript,
            timestamp: new Date().toISOString()
        };
    }

    reset() {
        this.maxThreatLevel = 'benign';
        this.currentPersona = 'ELDERLY';
        this.iocs = {
            urls: [],
            domains: [],
            paymentMethods: [],
            sensitiveDataRedacted: 0
        };
    }
}
