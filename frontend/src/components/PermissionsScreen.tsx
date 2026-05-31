import React, { useState } from 'react';
import { Shield, ShieldCheck, Globe, Database, MapPin, Bell, Fingerprint, ChevronRight, Layers } from 'lucide-react';
import { soundManager } from '../lib/SoundManager';

interface PermissionItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const REQUIRED_PERMISSIONS: PermissionItem[] = [
    {
        id: 'internet',
        title: 'INTERNET ACCESS',
        description: 'Core Neural Model Streaming and real-time backend Telemetry updates.',
        icon: <Globe size={22} color="#3b82f6" />
    },
    {
        id: 'storage',
        title: 'ENCRYPTED STORAGE',
        description: 'Required for local Deepfake indices and analytical forensic logs tracking.',
        icon: <Database size={22} color="#ec4899" />
    },
    {
        id: 'location',
        title: 'GEOLOCATION RADAR',
        description: 'Visualizes global scam origin hubs onto the threat mapping module.',
        icon: <MapPin size={22} color="#10b981" />
    },
    {
        id: 'notifications',
        title: 'SYSTEM NOTIFICATIONS',
        description: 'Failsafe alerts for high-risk scam intercept scalar background updates.',
        icon: <Bell size={22} color="#fbbf24" />
    },
    {
        id: 'biometrics',
        title: 'BIOMETRIC SECURE KEY',
        description: 'FaceID or Fingerprint access keys to lock drawer vault drawers safeguards.',
        icon: <Fingerprint size={22} color="#a78bfa" />
    },
    {
        id: 'app_interaction',
        title: 'APP INTERACTION ACCESS',
        description: 'Allows Rakshak to monitor and intercept malicious payloads in third-party messaging apps.',
        icon: <Layers size={22} color="#f87171" />
    }
];

interface PermissionsScreenProps {
    onGrant: () => void;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onGrant }) => {
    const [granted, setGranted] = useState<string[]>([]);
    const [isInitializing, setIsInitializing] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePermission = (id: string) => {
        setGranted(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
        soundManager.playClick();
    };

    const handleInitialize = async () => {
        if (!allGranted) {
            soundManager.playScanError();
            return;
        }
        
        setIsInitializing(true);
        soundManager.playNotification();
        
        for (let i = 0; i <= 100; i += 10) {
            setProgress(i);
            await new Promise(r => setTimeout(r, 150));
        }
        
        soundManager.playSuccess();
        onGrant();
    };

    const allGranted = granted.length === REQUIRED_PERMISSIONS.length;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', overflowY: 'auto'
        }}>
            <div className="sys-card" style={{
                maxWidth: '500px', width: '100%', padding: '2.5rem',
                background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                margin: 'auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', width: 'fit-content', 
                        padding: '16px', borderRadius: '12px', margin: '0 auto 1rem auto',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                    }}>
                        <Shield size={36} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1.5px', color: '#fff', margin: '0 0 0.5rem 0' }}>SYSTEM INITIALIZATION</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Please authorize secure permissions to activate Rakshak AI matrix payloads node flawlessly.</p>
                </div>

                {isInitializing ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '1rem' }}>MOUNTING NEURAL VECTORS...</div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.15s ease-out', boxShadow: '0 0 10px var(--primary)' }} />
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {progress < 30 && '> Calibrating Neural Grids...'}
                            {progress >= 30 && progress < 60 && '> Decrypting Forensic Headers...'}
                            {progress >= 60 && progress < 90 && '> Sealing CyberCell Channels...'}
                            {progress >= 90 && '> SYSTEM SECURE. INITIALIZING...'}
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2.5rem' }}>
                            {REQUIRED_PERMISSIONS.map(p => {
                                const isGranted = granted.includes(p.id);
                                return (
                                    <div 
                                        key={p.id}
                                        onClick={() => togglePermission(p.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                            background: isGranted ? 'rgba(59, 130, 246, 0.04)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isGranted ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>{p.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: isGranted ? '#fff' : '#cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}>{p.title}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '2px' }}>{p.description}</div>
                                        </div>
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%',
                                            border: `2px solid ${isGranted ? 'var(--primary)' : '#64748b'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: isGranted ? 'var(--primary)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            {isGranted && <ShieldCheck size={12} color="#000" strokeWidth={3} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleInitialize}
                            disabled={!allGranted}
                            style={{
                                width: '100%', padding: '14px', background: allGranted ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: allGranted ? '#000' : '#475569', border: 'none', borderRadius: '12px',
                                fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', cursor: allGranted ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.3s', boxShadow: allGranted ? '0 4px 20px rgba(59, 130, 246, 0.3)' : 'none'
                            }}
                        >
                            {allGranted ? 'INITIALIZE SYSTEM' : 'AUTHORIZE ALL PERMISSIONS'} 
                            {allGranted && <ChevronRight size={18} />}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
