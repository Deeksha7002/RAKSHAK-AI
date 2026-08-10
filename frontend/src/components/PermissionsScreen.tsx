import React, { useState } from 'react';
import { Shield, MapPin, Bell, Mic, ChevronRight } from 'lucide-react';
import { soundManager } from '../lib/SoundManager';

interface PermissionsScreenProps {
    onGrant: () => void;
}

type OnboardingStep = 'intro' | 'location' | 'notifications' | 'microphone' | 'initializing';

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onGrant }) => {
    const [step, setStep] = useState<OnboardingStep>('intro');
    const [progress, setProgress] = useState(0);

    const handleGrantPermission = (permissionId: string) => {
        soundManager.playClick();
        advanceStep(permissionId);
    };

    const handleSkipPermission = (permissionId: string) => {
        soundManager.playClick();
        advanceStep(permissionId);
    };

    const advanceStep = (currentPermission: string) => {
        if (currentPermission === 'location') {
            setStep('notifications');
        } else if (currentPermission === 'notifications') {
            setStep('microphone');
        } else if (currentPermission === 'microphone') {
            startInitialization();
        }
    };

    const startInitialization = async () => {
        setStep('initializing');
        soundManager.playNotification();
        
        for (let i = 0; i <= 100; i += 10) {
            setProgress(i);
            await new Promise(r => setTimeout(r, 150));
        }
        
        soundManager.playSuccess();
        onGrant();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', overflowY: 'auto'
        }}>
            <div className="sys-card" style={{
                maxWidth: '480px', width: '100%', padding: '2.5rem',
                background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                margin: 'auto'
            }}>
                {step === 'intro' && (
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ 
                            background: 'rgba(16, 185, 129, 0.1)', width: 'fit-content', 
                            padding: '16px', borderRadius: '12px', marginBottom: '1.5rem',
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
                        }}>
                            <Shield size={36} color="#10b981" />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>🛡️ Rakshak</h2>
                        <p style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Stay safe from online scams.</p>
                        
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Rakshak helps detect:</p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Scam messages</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Suspicious links</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Fake websites</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> Deepfake media</li>
                            </ul>
                        </div>

                        <p style={{ color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Let's set up your protection.</p>

                        <button
                            onClick={() => { soundManager.playClick(); setStep('location'); }}
                            style={{
                                width: '100%', padding: '14px', background: '#10b981',
                                color: '#000', border: 'none', borderRadius: '12px',
                                fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(16,185,129,0.3)'
                            }}
                        >
                            Start Protection <ChevronRight size={18} />
                        </button>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>You can change these settings later.</p>
                    </div>
                )}

                {(step === 'location' || step === 'notifications' || step === 'microphone') && (
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', margin: '0 0 1.5rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Choose what Rakshak can use</h3>
                        
                        {step === 'location' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', margin: '1rem 0' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: 'fit-content', padding: '20px', borderRadius: '50%', marginBottom: '0.5rem' }}>
                                    <MapPin size={48} color="#10b981" />
                                </div>
                                <h4 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>📍 Location</h4>
                                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '320px', margin: 0 }}>
                                    Helps identify where suspicious activity may be coming from.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
                                    <button
                                        onClick={() => handleSkipPermission('location')}
                                        style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={() => handleGrantPermission('location')}
                                        style={{ flex: 1, padding: '12px', background: '#10b981', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                        Allow
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'notifications' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', margin: '1rem 0' }}>
                                <div style={{ background: 'rgba(251, 191, 36, 0.1)', width: 'fit-content', padding: '20px', borderRadius: '50%', marginBottom: '0.5rem' }}>
                                    <Bell size={48} color="#fbbf24" />
                                </div>
                                <h4 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>🔔 Notifications</h4>
                                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '320px', margin: 0 }}>
                                    Lets Rakshak warn you about threats.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
                                    <button
                                        onClick={() => handleSkipPermission('notifications')}
                                        style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={() => handleGrantPermission('notifications')}
                                        style={{ flex: 1, padding: '12px', background: '#10b981', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                        Allow
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'microphone' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', margin: '1rem 0' }}>
                                <div style={{ background: 'rgba(167, 139, 250, 0.1)', width: 'fit-content', padding: '20px', borderRadius: '50%', marginBottom: '0.5rem' }}>
                                    <Mic size={48} color="#a78bfa" />
                                </div>
                                <h4 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>🎙️ Microphone</h4>
                                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '320px', margin: 0 }}>
                                    Used only when you analyze suspicious voice messages.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
                                    <button
                                        onClick={() => handleSkipPermission('microphone')}
                                        style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={() => handleGrantPermission('microphone')}
                                        style={{ flex: 1, padding: '12px', background: '#10b981', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                        Allow
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'initializing' && (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ color: '#10b981', fontWeight: 800, letterSpacing: '1px', marginBottom: '1.5rem', fontSize: '1.1rem' }}>STARTING PROTECTION...</div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', transition: 'width 0.15s ease-out', boxShadow: '0 0 10px #10b981' }} />
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace', height: '1.5rem' }}>
                            {progress < 35 && '> Setting up secure links check...'}
                            {progress >= 35 && progress < 70 && '> Preparing threat analysis...'}
                            {progress >= 70 && progress < 100 && '> Setting up reporting options...'}
                            {progress >= 100 && '> PROTECTION ACTIVE. READY...'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
