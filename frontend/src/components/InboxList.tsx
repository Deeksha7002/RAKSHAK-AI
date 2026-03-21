import React from 'react';
import type { Classification } from '../lib/types';
import { ArrowLeft } from 'lucide-react';

interface ThreadSummary {
    id: string;
    senderName: string;
    source: 'sms' | 'email' | 'chat';
    lastMessage: string;
    classification: Classification | null; // null = scanning
    isIntercepted: boolean;
    persona?: string;
    isCompromised?: boolean;
    autoReported?: boolean;
    isBlocked?: boolean;
}

interface InboxListProps {
    threads: ThreadSummary[];
    selectedThreadId: string | null;
    onSelectThread: (id: string) => void;
    onBack?: () => void;
}

import { useThreads } from '../context/ThreadProvider';

export const InboxList: React.FC<InboxListProps> = ({ threads, selectedThreadId, onSelectThread, onBack }) => {
    const { archiveThread } = useThreads();
    const [swipingId, setSwipingId] = React.useState<string | null>(null);
    const [swipeOffset, setSwipeOffset] = React.useState(0);
    const touchStartX = React.useRef(0);

    const handleTouchStart = (e: React.TouchEvent, id: string) => {
        touchStartX.current = e.touches[0].clientX;
        setSwipingId(id);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const diff = touchStartX.current - currentX;
        // Only allow swiping left
        if (diff > 0) {
            setSwipeOffset(-Math.min(diff, 100)); // Cap at 100px
        } else {
            setSwipeOffset(0);
        }
    };

    const handleTouchEnd = () => {
        if (swipeOffset < -60) {
            setSwipeOffset(-80); // Snap to open
        } else {
            setSwipeOffset(0); // Snap shut
            setSwipingId(null);
        }
    };

    const getStatusClass = (classification: Classification | null) => {
        if (classification === 'scam' || classification === 'likely_scam') return 'status-scam';
        if (classification === 'benign') return 'status-safe';
        return '';
    };

    const getPersonaBadge = (persona?: string) => {
        switch (persona) {
            case 'INVESTOR': return '📈 INVESTOR';
            case 'CITIZEN': return '⚖ CITIZEN';
            case 'ELDERLY': return '👴 ELDERLY';
            case 'SKEPTICAL': return '🤨 SKEPTICAL';
            default: return null;
        }
    };

    return (
        <div className="inbox-container">
            {/* Header */}
            <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {onBack && (
                        <button onClick={onBack} className="nav-back-btn" title="Back to Dashboard">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    Messages
                </div>
            </div>

            <div className="thread-list">


                {threads.length === 0 && (
                    <div className="inbox-empty">Waiting for traffic...</div>
                )}
                {threads.map(t => (
                    <div
                        key={t.id}
                        onClick={() => onSelectThread(t.id)}
                        className={`thread-item ${selectedThreadId === t.id ? 'selected' : ''} ${getStatusClass(t.classification)}`}
                        onTouchStart={(e) => handleTouchStart(e, t.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Archive Action Revealed on Swipe */}
                        {swipingId === t.id && (
                            <div
                                className="swipe-action-archive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    archiveThread(t.id);
                                    setSwipeOffset(0);
                                    setSwipingId(null);
                                }}
                            >
                                ARCHIVE
                            </div>
                        )}

                        <div
                            className="thread-item-content"
                            style={{ transform: swipingId === t.id ? `translateX(${swipeOffset}px)` : 'none' }}
                        >
                            {/* Avatar */}
                            <div className="avatar">
                                {t.senderName.charAt(0)}
                            </div>

                            <div className="thread-content">
                                <div className="thread-top">
                                    <div className="sender-name">
                                        {t.senderName}
                                    </div>
                                    <span className="thread-time">Now</span>
                                </div>

                                <div className="thread-preview">
                                    {t.isIntercepted && <span className="ai-prefix">⚠ AI • </span>}
                                    {t.isCompromised && <span className="compromised-prefix" style={{ color: 'var(--status-danger)', fontWeight: 'bold' }}>[COMPROMISED] </span>}
                                    {t.lastMessage}
                                </div>

                                {t.isIntercepted && t.persona && (
                                    <div className={`persona-badge ${t.persona.toLowerCase()}`}>
                                        {getPersonaBadge(t.persona)}
                                    </div>
                                )}
                                {t.autoReported && (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'rgba(34, 197, 94, 0.15)',
                                        color: '#4ade80',
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        marginTop: '4px',
                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                        fontWeight: 'bold'
                                    }}>
                                        REPORTED
                                    </div>
                                )}

                                {t.isBlocked && (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#f87171',
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        marginTop: '4px',
                                        marginLeft: '4px',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        fontWeight: 'bold'
                                    }}>
                                        BLOCKED
                                    </div>
                                )}
                            </div >
                        </div>
                    </div >
                ))}
            </div >
        </div >
    );
};

