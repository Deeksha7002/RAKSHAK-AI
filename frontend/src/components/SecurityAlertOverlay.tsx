import React, { useEffect, useState } from 'react';
import { ShieldAlert, Zap, XCircle, Trash2 } from 'lucide-react';
import { soundManager } from '../lib/SoundManager';
import { useAuth } from '../context/AuthContext';

interface SecurityAlertData {
    alertType: 'LEAK' | 'THREAT';
    severity: 'HIGH' | 'CRITICAL';
    message: string;
    threadId: string;
    timestamp: number;
}

interface SecurityAlertOverlayProps {
    alert: SecurityAlertData | null;
    onClose: () => void;
}

export const SecurityAlertOverlay: React.FC<SecurityAlertOverlayProps> = ({ alert, onClose }) => {
    const { nukeAccountWithPassword } = useAuth();
    const [showNukeConfirm, setShowNukeConfirm] = useState(false);
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!alert) return;

        // Pulse the siren
        const interval = setInterval(() => {
            soundManager.playSiren();
        }, 800);
        
        return () => clearInterval(interval);
    }, [alert]);

    const handleNuke = async () => {
        if (!password) return;
        try {
            await nukeAccountWithPassword(password);
        } catch (e) {
            window.alert('Nuke protocol failed: Invalid credentials');
        }
    };

    if (!alert) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            fontFamily: 'monospace'
        }}>
            <div className={`alert-pulse-${alert.severity.toLowerCase()}`} style={{
                width: '90%',
                maxWidth: '500px',
                background: '#0a0a0a',
                border: `2px solid ${alert.severity === 'CRITICAL' ? '#ff0000' : '#ef4444'}`,
                padding: '3rem',
                textAlign: 'center',
                borderRadius: '8px',
                boxShadow: `0 0 50px ${alert.severity === 'CRITICAL' ? 'rgba(255, 0, 0, 0.6)' : 'rgba(239, 68, 68, 0.4)'}`
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }} />
                    <h1 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: 900, 
                        letterSpacing: '4px', 
                        margin: 0,
                        color: alert.severity === 'CRITICAL' ? '#ff0000' : '#fff' 
                    }}>
                        {alert.severity === 'CRITICAL' ? 'CRITICAL SYSTEM BREACH' : 'SECURITY ALERT'}
                    </h1>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        background: 'rgba(239, 68, 68, 0.2)', 
                        padding: '0.4rem 1rem', 
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#f87171',
                        marginBottom: '1rem',
                        textTransform: 'uppercase'
                    }}>
                        <Zap size={14} />
                        {alert.alertType} DETECTED
                    </div>
                    <p style={{ 
                        fontSize: '1rem', 
                        lineHeight: 1.6, 
                        color: '#d1d5db',
                        margin: '0 0 1rem 0'
                    }}>
                        {alert.message}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>
                        INCIDENT REF: {alert.threadId.toUpperCase()} • T+{new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {!showNukeConfirm ? (
                        <>
                            <button 
                                onClick={onClose}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    padding: '1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                <XCircle size={18} /> ACKNOWLEDGE RISK
                            </button>
                            <button 
                                onClick={() => setShowNukeConfirm(true)}
                                style={{
                                    background: '#7f1d1d',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '1rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                <Trash2 size={18} /> PANIC: NUKE SESSION
                            </button>
                        </>
                    ) : (
                        <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '4px', border: '1px solid #7f1d1d' }}>
                            <p style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: '1rem', fontWeight: 'bold' }}>
                                WARNING: This will permanently shred all session data and log you out.
                            </p>
                            <input 
                                type="password" 
                                placeholder="Operator Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#000',
                                    border: '1px solid #333',
                                    color: '#fff',
                                    padding: '0.75rem',
                                    borderRadius: '4px',
                                    marginBottom: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                    onClick={() => setShowNukeConfirm(false)}
                                    style={{ flex: 1, background: '#333', border: 'none', color: '#fff', padding: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}>
                                    CANCEL
                                </button>
                                <button 
                                    onClick={handleNuke}
                                    style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    SHRED ALL
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .alert-pulse-critical {
                    animation: alert-glow-critical 0.6s infinite alternate;
                }
                .alert-pulse-high {
                    animation: alert-glow-high 1.5s infinite alternate;
                }
                @keyframes alert-glow-critical {
                    from { box-shadow: 0 0 20px rgba(255, 0, 0, 0.4); }
                    to { box-shadow: 0 0 60px rgba(255, 0, 0, 0.8); }
                }
                @keyframes alert-glow-high {
                    from { box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
                    to { box-shadow: 0 0 40px rgba(239, 68, 68, 0.5); }
                }
            `}</style>
        </div>
    );
};
