import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type { Thread } from '../lib/types';



interface ThreadContextType {
    threads: Thread[];
    setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
    clearThreads: () => void;
    archiveThread: (id: string) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

const MAX_THREADS = 50;

export const ThreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [threads, setThreads] = useState<Thread[]>([]);

    const storageKey = currentUser ? `threads_${currentUser.id}` : null;

    // Load user-specific threads
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    setThreads(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to load threads", e);
                    setThreads([]);
                }
            } else {
                setThreads([]);
            }
        } else {
            setThreads([]);
        }
    }, [storageKey]);

    // Save threads when they change with Quota Protection
    useEffect(() => {
        if (!storageKey) return;

        const saveToStorage = (data: Thread[]) => {
            try {
                if (data.length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                } else {
                    localStorage.removeItem(storageKey);
                }
                return true;
            } catch (e) {
                if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                    console.warn("⚠️ LocalStorage quota exceeded. Attempting to prune threads...");
                    return false;
                }
                console.error("❌ Failed to save threads to storage", e);
                return true; // Stop loop if it's not a quota error
            }
        };

        // 1. Enforce Hard Cap First
        let currentThreads = [...threads];
        if (currentThreads.length > MAX_THREADS) {
            currentThreads = currentThreads.slice(-MAX_THREADS);
            setThreads(currentThreads); // Update state to match cap
        }

        // 2. Initial Save Attempt
        if (!saveToStorage(currentThreads)) {
            // 3. Auto-Cleanup Strategy (2nd one)
            // Priority 1: Clear archived threads
            let pruned = currentThreads.filter(t => !t.isArchived);
            if (saveToStorage(pruned)) {
                console.info("✅ Space cleared by removing archived threads.");
                setThreads(pruned);
            } else {
                // Priority 2: Keep only the 20 most recent threads
                pruned = pruned.slice(-20);
                if (saveToStorage(pruned)) {
                    console.info("✅ Space cleared by keeping only the 20 most recent threads.");
                    setThreads(pruned);
                } else {
                    console.error("💀 Storage still full after pruning. Clearing all local threads.");
                    localStorage.removeItem(storageKey); // Catastrophic Fallback
                }
            }
        }
    }, [threads, storageKey]);

    const clearThreads = () => {
        setThreads([]);
        if (storageKey) localStorage.removeItem(storageKey);
    };

    const archiveThread = (id: string) => {
        setThreads(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ThreadContext.Provider value={{ threads, setThreads, clearThreads, archiveThread }}>
            {children}
        </ThreadContext.Provider>
    );
};

export const useThreads = () => {
    const context = useContext(ThreadContext);
    if (!context) throw new Error('useThreads must be used within ThreadProvider');
    return context;
};
