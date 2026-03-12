export interface Message {
    id: string;
    sender: 'scammer' | 'agent' | 'system';
    senderName?: string; // e.g. "Mom", "Bank of America"
    source?: 'sms' | 'email' | 'chat';
    content: string;
    timestamp: number;
    isRedacted?: boolean;
    attachments?: {
        type: MediaType;
        url: string;
        name: string;
        isShredded?: boolean;
    }[];
}

export type Classification = 'scam' | 'likely_scam' | 'benign' | ScamType;

export interface Scenario {
    id: string;
    type: Classification;
    source: 'sms' | 'email' | 'chat';
    senderName: string;
    relationalContext?: 'family' | 'work' | 'friend';
    location?: string; // e.g. "Nigeria", "Russia", "Unknown"
    messages: string[];
    attachments?: {
        type: MediaType;
        url: string;
        name: string;
        isShredded?: boolean;
    }[];
}

export interface IOCs {
    urls: string[];
    domains: string[];
    paymentMethods: string[];
    sensitiveDataRedacted: number;
}

export interface FinancialIntel {
    method: 'UPI' | 'IBAN' | 'ACH' | 'CRYPTO' | 'Wire Transfer' | 'CRYPTO WALLET';
    identifier: string;
    institution?: string;
    flagged?: boolean;
}

export interface GeoLocation {
    country: string;
    city: string;
    ip: string;
    lat: number;
    lng: number;
    isp: string;
    connectionType?: 'VPN' | 'Residential' | 'Cellular' | 'Hosting';
    financials?: FinancialIntel;
}

export interface IncidentReport {
    conversationId: string;
    scammerName?: string;
    platform?: string;
    classification: Classification;
    scamType: ScamType;
    confidenceScore: number; // 0-1
    iocs: IOCs;
    transcript: Message[];
    timestamp: string;
    detectedLocation?: GeoLocation; // New field
}

export interface Thread {
    id: string;
    scenarioId: string;
    senderName: string;
    source: 'sms' | 'email' | 'chat';
    messages: Message[];
    classification: Classification | null;
    isIntercepted: boolean;
    isArchived: boolean;
    isBlocked?: boolean;
    autoReported?: boolean;
    isScanning: boolean;
    persona?: string;
    avatar?: string;
    location?: string;
    detectedLocation?: GeoLocation;
    intent?: string;
    threatScore?: number;
    isCompromised?: boolean;
}

export interface CaseFile {
    id: string;
    scammerName: string;
    platform: string;
    status: 'active' | 'closed';
    threatLevel: Classification;
    iocs: IOCs;
    transcript: Message[];
    timestamp: string;
    detectedLocation?: GeoLocation;
    autoReported?: boolean; // Added this field
    scamType?: ScamType;
}

export type ScamType = 'ROMANCE' | 'CRYPTO' | 'JOB' | 'IMPERSONATION' | 'LOTTERY' | 'TECHNICAL_SUPPORT' | 'AUTHORITY' | 'OTHER';

export interface ScamRecord {
    id: string;
    timestamp: number;
    type: ScamType;
    senderName: string;
    conversationId: string;
    identifiers: string[]; // Wallets, URLs, IPs captured
}

export interface IntelligenceSummary {
    today: number;
    week: number;
    month: number;
    byType: Record<ScamType, number>;
    uniqueScammers: number;
    repeatedIdentifiers: string[];
    today_types?: Record<ScamType, number>;
    week_types?: Record<ScamType, number>;
    month_types?: Record<ScamType, number>;
    today_scammers?: number;
    week_scammers?: number;
    month_scammers?: number;
}

export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

export interface MediaAnalysisResult {
    mediaType: MediaType;
    authenticityScore: number; // 0-100
    confidenceLevel: 'Low' | 'Medium' | 'High';
    keyFindings: string[];
    technicalIndicators: string[];
    recommendation: 'Authentic' | 'Likely Authentic' | 'Inconclusive' | 'Likely Manipulated' | 'Manipulated' | 'Authentic Graphic';
    reasoning: string;
    anomalyScore?: number; // 0-100 (Unseen patterns)
    generalizationConfidence?: number; // 0-100
    isAdversarial?: boolean;
    timestamp: number;
    privacyMetadata?: {
        isLocalAnalysis: boolean;
        piiScrubbed: boolean;
    };
}

export interface ForensicLog {
    id: string;
    senderId: string;
    senderName: string;
    mediaType: MediaType;
    confidence: 'Low' | 'Medium' | 'High';
    action: 'STORED' | 'REPORTED' | 'BLOCKED';
    timestamp: number;
    result: MediaAnalysisResult;
}
