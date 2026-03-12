import React from 'react';
import { Shield, Fingerprint, Lock, EyeOff, Server, Terminal, X } from 'lucide-react';

interface SecurityProtocolModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SecurityProtocolModal: React.FC<SecurityProtocolModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="locker-overlay" style={{ zIndex: 1000 }}>
            <div className="locker-modal" style={{ width: '600px', height: 'auto', maxHeight: '85vh' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield className="text-emerald-500" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', letterSpacing: '1px' }}>CORE INTEGRITY PROTOCOL</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '2rem', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        
                        {/* Biometric Protocol */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '10px', height: 'fit-content' }}>
                                <Fingerprint size={20} color="#22d3ee" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#fff' }}>I. BIOMETRIC SOVEREIGNTY (FIDO2/WebAuthn)</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                    Your biometric data (fingerprint/face) never leaves your physical device. We utilize the <span style={{ color: '#22d3ee' }}>WebAuthn API</span> to perform hardware-backed cryptographic signatures. Rakshak AI stores only a public credential ID, rendering server-side biometric theft mathematically impossible.
                                </p>
                            </div>
                        </div>

                        {/* PII Redaction */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', height: 'fit-content' }}>
                                <EyeOff size={20} color="#f87171" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#fff' }}>II. AUTOMATED PII SHREDDING</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                    All incoming data passes through our proprietary <span style={{ color: '#f87171' }}>SafetyGuard Engine</span> before processing. Phone numbers, emails, and physical addresses are redacted in memory. Live LLM analysis is performed only on anonymized "SafeText" to ensure zero-leakage of personal artifacts.
                                </p>
                            </div>
                        </div>

                        {/* Cryptographic Anonymization */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', height: 'fit-content' }}>
                                <Lock size={20} color="#10b981" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#fff' }}>III. DETERMINISTIC HASHING</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                    External threat identifiers (Scammer UPIs, URLs) are processed using <span style={{ color: '#10b981' }}>SHA-256 with local entropy salt</span>. This allows for collision-free evidence tracking across the ecosystem while ensuring that data cannot be reversed to its original state by unauthorized third parties.
                                </p>
                            </div>
                        </div>

                        {/* Connection Integrity */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', height: 'fit-content' }}>
                                <Server size={20} color="#fbbf24" />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#fff' }}>IV. ZERO-TRUST ARCHITECTURE</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                    All service-to-service communication occurs over <span style={{ color: '#fbbf24' }}>TLS 1.3 encrypted tunnels</span>. Authenticator challenges are single-use (nonces) and expire after 60 seconds to prevent replay attacks on the secure uplink.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                <div style={{ padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>
                        <Terminal size={14} /> SYSTEM INTEGRITY VERIFIED • MISSION READY
                    </div>
                </div>
            </div>
        </div>
    );
};
