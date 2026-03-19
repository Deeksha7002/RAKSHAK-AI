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

    // Save threads when they change
    useEffect(() => {
        if (storageKey && threads.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(threads));
        } else if (storageKey) {
            localStorage.removeItem(storageKey);
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
