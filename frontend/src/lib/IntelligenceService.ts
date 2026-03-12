import type { ScamRecord, IntelligenceSummary } from './types';
import { API_BASE_URL } from './config';

export class IntelligenceService {
    private static records: ScamRecord[] = [];
    private static backendStats: any = null;
    private static listeners: (() => void)[] = [];

    static subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private static notifyListeners() {
        this.listeners.forEach(l => l());
    }

    static recordScam(record: Omit<ScamRecord, 'id' | 'timestamp'>) {
        // Prevent recording the exact same conversation multiple times per message
        // Just update existing or push if new
        const existing = this.records.find(r => r.conversationId === record.conversationId);
        if (existing) {
            // Merge identifiers
            existing.identifiers = Array.from(new Set([...existing.identifiers, ...record.identifiers]));
            existing.type = record.type; // Update type if it escalated
        } else {
            const newRecord: ScamRecord = {
                ...record,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: Date.now()
            };
            this.records.push(newRecord);

            // Rolling history: Keep only last 100 in-memory deep-dive records to prevent memory leaks
            if (this.records.length > 100) {
                this.records.shift();
            }

            console.log(`[IntelligenceService] 📊 Recorded ${record.type} scam attempt from ${record.senderName}`);
        }
        this.notifyListeners();
    }

    static async syncWithBackend(): Promise<void> {
        try {
            const token = localStorage.getItem('rakshak_access_token');
            const res = await fetch(`${API_BASE_URL}/api/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                this.backendStats = await res.json();
                console.log('[IntelligenceService] 📊 Synced stats from backend:', this.backendStats);
            }
        } catch (e) {
            console.warn('[IntelligenceService] ⚠️ Failed to sync stats from backend.');
        }
    }

    static getSummary(): IntelligenceSummary {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        // Local calculations for real-time updates (only those not yet synced from backend if possible, but simplest is to just add)
        const localTodays = this.records.filter(r => now - r.timestamp < oneDay);
        const localWeeks = this.records.filter(r => now - r.timestamp < oneWeek);
        const localMonths = this.records.filter(r => now - r.timestamp < oneMonth);

        // Merge with backend stats
        const backendTypes = this.backendStats?.types || {};

        // Helper to merge breakdown types ensuring all base keys exist
        const mergeTypes = (backend: Record<string, number>, localRecs: ScamRecord[]) => {
            const merged: any = {
                ROMANCE: 0, CRYPTO: 0, JOB: 0, IMPERSONATION: 0,
                LOTTERY: 0, TECHNICAL_SUPPORT: 0, AUTHORITY: 0, OTHER: 0,
                ...backend
            };
            localRecs.forEach(r => {
                const t = r.type || 'OTHER';
                merged[t] = (merged[t] || 0) + 1;
            });
            return merged;
        };

        const todayTypes = mergeTypes(this.backendStats?.today_types || backendTypes, localTodays);
        const weekTypes = mergeTypes(this.backendStats?.week_types || backendTypes, localWeeks);
        const monthTypes = mergeTypes(this.backendStats?.month_types || backendTypes, localMonths);
        const baseTypes = mergeTypes(backendTypes, this.records);

        const summary: IntelligenceSummary = {
            today: (this.backendStats?.today || 0) + localTodays.length,
            week: (this.backendStats?.week || this.backendStats?.reports_filed || 0) + localWeeks.length,
            month: (this.backendStats?.month || this.backendStats?.reports_filed || 0) + localMonths.length,
            byType: baseTypes,
            today_types: todayTypes,
            week_types: weekTypes,
            month_types: monthTypes,
            today_scammers: (this.backendStats?.today_scammers || 0) + new Set(localTodays.map(r => r.senderName)).size,
            week_scammers: (this.backendStats?.week_scammers || 0) + new Set(localWeeks.map(r => r.senderName)).size,
            month_scammers: (this.backendStats?.month_scammers || 0) + new Set(localMonths.map(r => r.senderName)).size,
            uniqueScammers: (this.backendStats?.reports_filed || 0) + new Set(this.records.map(r => r.senderName)).size,
            repeatedIdentifiers: this.getRepeatedIdentifiers()
        };

        return summary;
    }

    private static getRepeatedIdentifiers(): string[] {
        const counts: Record<string, number> = {};
        const repeated: string[] = [];

        this.records.forEach(r => {
            r.identifiers.forEach(id => {
                counts[id] = (counts[id] || 0) + 1;
                if (counts[id] === 2) repeated.push(id);
            });
        });

        return repeated;
    }

    static getRecords(range: 'today' | 'week' | 'month'): ScamRecord[] {
        const now = Date.now();
        const ms = range === 'today' ? 24 * 3600 * 1000 : range === 'week' ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
        return this.records.filter(r => now - r.timestamp < ms);
    }

    /**
     * Wipes all records from volatile memory.
     */
    static clearRecords() {
        this.records = [];
        console.log('[IntelligenceService] 🗑️ All scam records have been wiped.');
    }
}
