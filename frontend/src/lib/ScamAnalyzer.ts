import type { Message } from './types';

/**
 * Rakshak AI Frontend Scam Analyzer v3.0
 * Robust pattern-matching engine for instant client-side scam detection.
 * The backend Python engine provides a second-pass, but this provides immediate classification.
 */
export class ScamAnalyzer {
    sophisticationScore: number = 0.0;
    categorization: 'scripted_bot' | 'low_skill_human' | 'sophisticated_human' | 'unknown' = 'unknown';

    // ── Instant-Flag Regex Patterns ────────────────────────────────────────────
    // Any match = immediate SCAM (0.95 confidence). No further scoring needed.
    private readonly INSTANT_SCAM_PATTERNS: RegExp[] = [
        // Tech Support Scams
        /(?:detected|found|identified).{0,40}(?:virus|malware|threat|breach|hack|trojan|infected)/i,
        /(?:virus|malware|threat).{0,40}(?:detected|found|your computer|your device|windows|mac)/i,
        /your (?:computer|device|pc|mac|windows|system|phone).{0,40}(?:infected|hacked|compromised|virus|breach)/i,
        /your (?:account|wallet|card|data|information).{0,40}(?:compromised|hacked|breached|stolen|leaked|unauthorized)/i,
        /(?:microsoft|apple|google|amazon|coinbase|binance|paypal|netflix|bank|support team).{0,30}(?:support|helpdesk|team|official|alert|warning)/i,
        /(?:call|contact).{0,30}(?:support|helpline|toll.?free|number).{0,30}(?:immediately|now|urgent|asap)/i,
        /(?:remote|access|anydesk|teamviewer|ultraviewer).{0,30}(?:computer|device|pc|system|desktop)/i,
        /(?:install|download|run).{0,30}(?:anydesk|teamviewer|ultraviewer|remote|software|app)/i,
        // Account/KYC Suspension Scams  
        /your (?:account|subscription|service|membership|access).{0,30}(?:suspend|block|terminat|close|cancel|expir)/i,
        /(?:update|complete|verify).{0,30}(?:kyc|information|identity|details|profile).{0,30}(?:immediate|now|today|urgent|or)/i,
        /(?:kyc|account|verify).{0,30}(?:suspend|close|block).{0,30}(?:within|hour|day|immediate)/i,
        // Prize / Lottery Scams
        /(?:won|win|winner|selected|congratulations|chosen).{0,40}(?:prize|lottery|reward|award|gift|cash|money)/i,
        /(?:claim|collect|receive).{0,40}(?:prize|reward|winning|lottery|jackpot)/i,
        // Job Scams
        /(?:earn|make|income).{0,30}(?:\$|\₹|dollar|rupee).{0,20}(?:per|daily|week|hour|day|home|task)/i,
        /(?:work from home|wfh|part.?time|online job).{0,40}(?:earn|income|salary|payment|daily)/i,
        // Financial Phishing
        /(?:send|transfer|wire|pay).{0,30}(?:bitcoin|btc|crypto|usdt|eth|gift card|itunes|google play)/i,
        /(?:otp|one.time.password|verification code).{0,30}(?:share|send|tell|give|provide)/i,
        /(?:share|provide|give|send).{0,30}(?:otp|pin|password|card number|cvv|account number)/i,
        // Authority/Legal Coercion
        /(?:police|fbi|irs|court|legal|warrant|arrest|case).{0,40}(?:filed|pending|register|issued|against you)/i,
    ];

    // ── High-Risk Keyword Groups ──────────────────────────────────────────────
    // Weighted scoring. Multiple hits = escalating risk.
    private readonly RISK_LEXICONS: Record<string, string[]> = {
        tech_threat: ['virus', 'malware', 'hacked', 'infected', 'detected', 'breach', 'compromised', 'trojan', 'ransomware', 'threat', 'attack', 'unauthorized', 'blocked', 'dangerous', 'critical'],
        tech_action: ['remote', 'access', 'teamviewer', 'anydesk', 'support', 'technician', 'helpdesk', 'call now', 'contact us', 'scan', 'remove', 'protect', 'install', 'download'],
        impersonation: ['microsoft', 'apple', 'google', 'amazon', 'coinbase', 'binance', 'paypal', 'netflix', 'bank', 'government', 'irs', 'helpline', 'official', 'authority'],
        financial: ['money', 'card', 'bank', 'transfer', 'wire', 'deposit', 'payment', 'fee', 'cash', 'crypto', 'btc', 'wallet', 'usdt', 'salary', 'income', 'profit', 'earnings', 'commission', 'bonus'],
        credentials: ['password', 'pin', 'otp', 'code', 'credential', 'login', 'ssn', 'identity', 'account', 'verification', 'seed', 'phrase'],
        urgency: ['urgent', 'immediately', 'now', 'hurry', 'fast', 'expires', 'deadline', 'today', 'quick', 'asap', 'limited', 'last chance'],
        coercion: ['police', 'lawsuit', 'jail', 'arrest', 'warrant', 'court', 'suspended', 'banned', 'fbi', 'frozen', 'investigated', 'seized', 'legal action'],
    };

    analyzeBehavior(history: Message[]): { score: number, category: string } {
        if (!history || history.length === 0) return { score: 0.0, category: 'unknown' };

        const scammerMsgs = history.filter(m => m.sender === 'scammer').map(m => m.content);
        if (scammerMsgs.length === 0) return { score: 0.0, category: 'unknown' };

        const fullText = scammerMsgs.join(' ');

        // ── PASS 1: Instant Flag Check ──────────────────────────────────────────
        for (const pattern of this.INSTANT_SCAM_PATTERNS) {
            if (pattern.test(fullText)) {
                this.sophisticationScore = 0.95;
                this.categorization = 'scripted_bot';
                return { score: 0.95, category: 'scam' };
            }
        }

        // ── PASS 2: Weighted Lexicon Scoring ────────────────────────────────────
        const lowerText = fullText.toLowerCase();
        const words = lowerText.split(/\s+/);
        const wordSet = new Set(words);
        const total = Math.max(words.length, 1);

        let riskScore = 0.0;
        const weights: Record<string, number> = {
            tech_threat: 3.0, tech_action: 2.0, impersonation: 3.5,
            financial: 2.0, credentials: 3.0, urgency: 1.5, coercion: 2.5
        };
        for (const [group, keywords] of Object.entries(this.RISK_LEXICONS)) {
            const hits = keywords.filter(kw => lowerText.includes(kw)).length;
            riskScore += (hits / total) * weights[group];
        }

        // ── PASS 3: Short-message amplification ─────────────────────────────────
        if (total <= 10 && riskScore > 0.2) riskScore *= 2.0;

        // Clamp
        this.sophisticationScore = Math.min(riskScore, 1.0);

        if (this.sophisticationScore >= 0.65) {
            this.categorization = 'scripted_bot';
            return { score: this.sophisticationScore, category: 'scam' };
        } else if (this.sophisticationScore >= 0.3) {
            this.categorization = 'low_skill_human';
            return { score: this.sophisticationScore, category: 'likely_scam' };
        } else {
            this.categorization = 'sophisticated_human';
            return { score: this.sophisticationScore, category: 'benign' };
        }
    }
}
