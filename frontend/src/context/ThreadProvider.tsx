import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import type { Thread } from '../lib/types';



interface ThreadContextType {
    threads: Thread[];
    setThreads: React.Dispatch<React.SetStateAction<Thread[]>>;
    clearThreads: () => void;
    archiveThread: (id: string) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);



export const ThreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [threads, setThreads] = useState<Thread[]>([]);
    const saveTimeoutRef = useRef<any>(null);

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

    // Save threads when they change with DEBOUNCED Quota Protection
    useEffect(() => {
        if (!storageKey) return;

        // Clear existing debounce timer
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        const saveToStorage = (data: Thread[]) => {
            try {
                if (data.length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                } else {
                    localStorage.removeItem(storageKey);
                }
                return true;
            } catch (e) {
                // Silently handle quota errors - don't crash the app
                return false;
            }
        };

        // 1-Second Debounce to keep UI buttery smooth 🧈
        saveTimeoutRef.current = setTimeout(() => {
            // 1. Enforce Hard Cap (Demo Optimized: 25 Threads)
            let currentThreads = [...threads];
            if (currentThreads.length > 25) {
                currentThreads = currentThreads.slice(-25);
            }

            // 2. Optimized Save Attempt
            if (!saveToStorage(currentThreads)) {
                console.warn("⚠️ LocalStorage full. Attempting aggressive pruning...");
                // Step 1: Remove archived threads
                let pruned = currentThreads.filter(t => !t.isArchived);
                if (!saveToStorage(pruned)) {
                    // Step 2: Keep only 10 most recent
                    pruned = pruned.slice(-10);
                    if (!saveToStorage(pruned)) {
                        console.error("💀 Storage critically full. Using RAM-only persistence.");
                    }
                }
            }
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
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
