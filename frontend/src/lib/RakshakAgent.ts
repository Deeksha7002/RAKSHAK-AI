import { RESPONSE_TEMPLATES } from './config';
import type { PersonaType } from './config';
import { SafetyGuard } from './Safety';
import { BaitGenerator } from './BaitGenerator';
import { ScamAnalyzer } from './ScamAnalyzer';
import { CyberCellService } from './CyberCellService';
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

        // Add to history (temporary message object for analysis)
        this.conversationHistory.push({
            id: Date.now().toString(),
            sender: 'scammer',
            content: safeText,
            timestamp: Date.now()
        });

        // 2. Classify & Extract IOCs
        const currentClassification = this.classify(text); // Use raw text for IOC extraction
        this.extractIOCs(text);

        // 3. Adaptive Persona Switching
        this.checkForPersonaSwitch(text);

        // 4. Update State (Threat Level Ratchet)
        if (currentClassification === 'scam') {
            this.maxThreatLevel = 'scam';
        } else if (currentClassification === 'likely_scam' && this.maxThreatLevel !== 'scam') {
            this.maxThreatLevel = 'likely_scam';
        }

        // 5. Advanced Analysis for UI
        const intent = this.detectIntent(text);
        const { score } = this.analyzer.analyzeBehavior(this.conversationHistory);

        // 6. Contextual Anomaly Detection (New)
        const isCompromised = this.detectCompromise(text, relationalContext);
        if (isCompromised) {
            // If compromised, force escalate to scam level
            this.maxThreatLevel = 'scam';
        }

        // 7. Heuristic Score Override
        // If the AI analyzer detects high threat but keywords missed it, upgrade classification
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

        const currentAutoReported = this.hasAutoReported;

        console.log(`[RakshakAgent] Ingest Complete. Class: ${this.maxThreatLevel}, Reported: ${currentAutoReported}, Intent: ${intent}`);

        if (currentClassification === 'scam' || currentClassification === 'likely_scam') {
            this.currentScamType = this.detectScamType(text);
        }
        return {
            classification: this.maxThreatLevel,
            safeText,
            intent,
            score: Math.round(score * 100), // 0-100 scale
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

    private checkForPersonaSwitch(text: string) {
        // ... (existing logic) relies on analyzeBehavior which is fine
        // We just need to make sure we don't duplicate the analysis call unnecessarily if performance matters, 
        // but for this scale it's fine to call it again or cache it.
        // For simplicity, I will leave the private call inside checkPersona separate from the public return.

        // 1. Check Sophistication via Analyzer
        const { score } = this.analyzer.analyzeBehavior(this.conversationHistory);
        // ... rest of checking logic
        if (score > 0.7) {
            if (this.currentPersona !== 'SKEPTICAL') {
                console.log(`[Persona Switch] ${this.currentPersona} -> SKEPTICAL (High Sophistication)`);
                this.currentPersona = 'SKEPTICAL';
            }
            return;
        }

        const lower = text.toLowerCase();

        // 2. Context Triggers (if not sophisticated)
        if (lower.match(/(bitcoin|crypto|invest|yield|profit|usdt|binance|coinbase)/)) {
            if (this.currentPersona !== 'INVESTOR') {
                this.currentPersona = 'INVESTOR';
            }
        }
        else if (lower.match(/(police|warrant|arrest|irs|federal|jail|legal|court)/)) {
            if (this.currentPersona !== 'CITIZEN') {
                this.currentPersona = 'CITIZEN';
            }
        }
        else if (score < 0.4 && this.currentPersona !== 'ELDERLY') {
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

    private classify(text: string): Classification {
        const lower = text.toLowerCase();
        // Expanded keywords for IRS, Tech Support, and general scams
        const scamKeywords = [
            "verify", "wallet", "private key", "bank", "earn", "compromised",
            "limited", "proposal", "transfer", "urgent", "click", "upi",
            "warrant", "arrest", "irs", "tax", "federal", "jail", // IRS/Authority
            "virus", "infected", "microsoft", "support", "hacked", "illegal", // Tech Support
            "prize", "winner", "won", "lottery", "claim", "reward", // Lottery
            "otp", "code", "pin", "password", "login", "account", // Phishing
            "btc", "eth", "crypto", "invest", "profit", "return" // Crypto
        ];

        if (scamKeywords.some(kw => lower.includes(kw))) return 'scam';
        if (lower.includes("http") || lower.includes(".com")) return 'likely_scam';
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

    generateResponse(classification: Classification, incomingText?: string): string | null {
        if (classification === 'benign') {
            const neutralResponses = [
                "Who is this?",
                "I think you have the wrong number.",
                "Sorry, do I know you?"
            ];
            return neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
        }

        let category = "GENERAL";

        if (incomingText) {
            const intent = this.detectIntent(incomingText);
            if (intent) category = intent;
        }

        // Get templates for current persona
        // Cast to any to access dynamic property matching
        const personaTemplates = RESPONSE_TEMPLATES[this.currentPersona] as Record<string, string[]>;
        const templates = personaTemplates[category] || personaTemplates["GENERAL"];

        // Simple deduplication: Try to pick a response different from the last one
        let response = templates[Math.floor(Math.random() * templates.length)];
        if (response === this.lastResponse && templates.length > 1) {
            // Retry once
            response = templates[Math.floor(Math.random() * templates.length)];
        }

        this.lastResponse = response;

        // Inject Bait
        if (response.includes("{credit_card}")) {
            response = response.replace("{credit_card}", BaitGenerator.generateFakeCard());
        }
        if (response.includes("{password}")) {
            response = response.replace("{password}", BaitGenerator.generateFakePassword());
        }
        if (response.includes("{otp}")) {
            response = response.replace("{otp}", BaitGenerator.generateFakeOTP());
        }

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
