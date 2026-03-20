import { API_BASE_URL } from './config';

export interface SyncData {
    intelligence_data: any;
    threat_coordinates: any[];
}

export class PersistenceService {
    private static syncTimeout: any = null;
    private static AUTH_TOKEN_KEY = 'rakshak_token';

    /**
     * Fetches the persisted dashboard state from the backend.
     */
    static async fetchPersistedState(): Promise<SyncData | null> {
        const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/api/sync`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch persisted state');
            const data = await response.json();
            
            if (!data.intelligence_data) return null;

            return {
                intelligence_data: data.intelligence_data,
                threat_coordinates: data.threat_coordinates || []
            };
        } catch (error) {
            console.error('❌ Persistence Error:', error);
            return null;
        }
    }

    /**
     * Persists the current state to the backend with debouncing to prevent API spam.
     */
    static queueSync(data: SyncData) {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);

        this.syncTimeout = setTimeout(() => {
            this.syncToBackend(data);
        }, 2000); // 2-second debounce
    }

    private static async syncToBackend(data: SyncData) {
        const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('🔄 Dashboard state synchronized with cloud vault.');
            }
        } catch (error) {
            console.warn('⚠️ Cloud Sync Failed - data remains in local memory.', error);
        }
    }

    /**
     * High-level utility to unify local and remote state during app initialization.
     */
    static async initializeState(setStats: (data: any) => void, setCoords: (coords: any[]) => void) {
        // 1. Load from localStorage for instant UI feedback (Optimistic)
        const localStats = localStorage.getItem('rakshak_intelligence_data');
        const localCoords = localStorage.getItem('threat_coordinates');
        
        if (localStats) setStats(JSON.parse(localStats));
        if (localCoords) setCoords(JSON.parse(localCoords));

        // 2. Refresh from Backend for Source of Truth
        const remoteState = await this.fetchPersistedState();
        if (remoteState) {
            setStats(remoteState.intelligence_data);
            setCoords(remoteState.threat_coordinates);
            
            // Sync local storage back to match server
            localStorage.setItem('rakshak_intelligence_data', JSON.stringify(remoteState.intelligence_data));
            localStorage.setItem('threat_coordinates', JSON.stringify(remoteState.threat_coordinates));
        }
    }
}
