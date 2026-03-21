import React, { useRef, useEffect, useState } from 'react';
import type { Message } from '../lib/types';
import { ShieldAlert, Bot, User, LockKeyhole } from 'lucide-react';

interface ChatWindowProps {
    messages: Message[];
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState<number>(0);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

    // 1. Thread Tracking & Reset
    useEffect(() => {
        if (messages.length === 0) {
            setVisibleCount(0);
            setCurrentThreadId(null);
            return;
        }
        
        // Use the very first message's unique ID as the permanent signature for this Thread
        const threadSignature = messages[0].id;
        
        if (threadSignature !== currentThreadId) {
            // New thread selected: Mount all strictly existing messages instantly to avoid re-typing history
            setVisibleCount(messages.length);
            setCurrentThreadId(threadSignature);
        }
    }, [messages, currentThreadId]);

    // 2. Sequential Delay Pump
    useEffect(() => {
        if (visibleCount < messages.length && currentThreadId === messages[0]?.id) {
            const nextMessage = messages[visibleCount];

            if (nextMessage.sender === 'scammer') {
                const delay = Math.max(800, Math.min(2500, nextMessage.content.length * 50));
                const timer = setTimeout(() => {
                    setVisibleCount(c => c + 1);
                }, delay);
                return () => clearTimeout(timer);
            } else {
                // Agent and System messages render instantly
                setVisibleCount(c => c + 1);
            }
        }
    }, [messages, visibleCount, currentThreadId]);

    // 3. Smooth Auto-Scroll Physics
    useEffect(() => {
        if (bottomRef.current) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 50);
        }
    }, [visibleCount]);

    const displayedMessages = messages.slice(0, visibleCount);
    const isTyping = visibleCount < messages.length && messages[visibleCount]?.sender === 'scammer';

    console.log(`%c🖥️ [ChatWindow] Render`, 'color: #10b981', { 
        messagesTotal: messages.length, 
        visible: visibleCount, 
        displayed: displayedMessages.length,
        isTyping
    });

    const isSystemAction = (msg: Message) => msg.sender === 'system' || (msg.sender === 'agent' && msg.content.startsWith('['));

    return (
        <div className="chat-window scroll-smooth">
            {displayedMessages.length === 0 && !isTyping && (
                <div className="empty-state" style={{ opacity: 0.8, textAlign: 'center', marginTop: '2rem' }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Secure Channel Established.</p>
                    <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>Awaiting anomalous packet interception...</p>
                </div>
            )}

            {displayedMessages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const isSystem = isSystemAction(msg);

                return (
                    <div
                        key={msg.id}
                        className={`message-row msg-enter-active ${isAgent ? 'agent' : 'scammer'}`}
                        style={{ marginTop: isSystem ? '1rem' : '0' }}
                    >
                        <div
                            className="message-bubble"
                            style={isSystem ? {
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid var(--status-success)',
                                color: 'var(--status-success)',
                                fontFamily: 'var(--font-mono)',
                                width: '100%',
                                maxWidth: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem'
                            } : undefined}
                        >
                            {!isSystem && (
                                <div className="msg-header">
                                    {isAgent ? <Bot size={14} /> : <User size={14} />}
                                    <span>{isAgent ? 'Scorpion AI' : 'Unknown Threat'}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '10px', opacity: 0.5 }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            )}

                            {isSystem && <LockKeyhole size={16} />}

                            <div className={`msg-content ${msg.content.includes('http') || msg.content.includes('.apk') ? 'decryption-glitch' : ''}`} data-text={msg.content}>
                                {msg.content}
                            </div>

                            {msg.attachments?.map((at, i) => (
                                <div key={i} className="attachment-container" style={{ marginTop: '0.5rem' }}>
                                    {at.isShredded ? (
                                        <div className="shredded-container" style={{
                                            background: 'linear-gradient(45deg, #050505, #111)',
                                            border: '1px solid var(--status-danger)',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ fontSize: '1.2rem' }}>☢️</div>
                                            <span style={{ color: 'var(--status-danger)', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                                PAYLOAD NEUTRALIZED
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textAlign: 'center' }}>
                                                Malicious signature shredded.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="media-preview" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            📎 {at.name} ({at.type})
                                        </div>
                                    )}
                                </div>
                            ))}

                            {msg.isRedacted && (
                                <div className="redacted-badge" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--status-warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                                    <ShieldAlert size={10} />
                                    <span>PII Scrubbed</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Simulated Typing Indicator Bubble */}
            {isTyping && (
                <div className="message-row scammer msg-enter-active">
                    <div className="message-bubble" style={{ background: 'transparent', boxShadow: 'none', padding: '0.5rem 0' }}>
                        <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invisible div to scroll to bottom securely */}
            <div ref={bottomRef} style={{ height: '10px' }} />

        </div>
    );
};
