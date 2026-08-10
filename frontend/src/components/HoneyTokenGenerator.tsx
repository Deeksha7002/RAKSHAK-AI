import React, { useState } from 'react';
import { Target, Link as LinkIcon, FileText, ShieldAlert, Cpu, Copy, CheckCircle, Radio, Activity, Fingerprint } from 'lucide-react';
import { useThreads } from '../context/ThreadProvider';
import type { Thread, GeoLocation } from '../lib/types';

const HIGH_RISK_LOCATIONS = [
  { lat: 14.5995, lng: 120.9842, city: 'Manila', country: 'Philippines', ip: '112.198.x.x', isp: 'PLDT Inc.' },
  { lat: 6.5244, lng: 3.3792, city: 'Lagos', country: 'Nigeria', ip: '102.89.x.x', isp: 'MTN Nigeria' },
  { lat: 28.6139, lng: 77.2090, city: 'New Delhi', country: 'India', ip: '117.200.x.x', isp: 'Bharti Airtel Ltd.' },
  { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia', ip: '46.146.x.x', isp: 'Rostelecom' },
  { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil', ip: '177.100.x.x', isp: 'Vivo' }
];

export const HoneyTokenGenerator: React.FC = () => {
    const { setThreads } = useThreads();
    const [tokenType, setTokenType] = useState<'PDF' | 'LINK'>('PDF');
    const [tokenUrl, setTokenUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [breachData, setBreachData] = useState<GeoLocation | null>(null);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTokenUrl(null);
        setCopied(false);
        setBreachData(null);
        
        setTimeout(() => {
            if (tokenType === 'PDF') {
                setTokenUrl('https://rakshak-net.proxy/docs/Payment_Receipt_9921.pdf(Tracking-Embedded)');
            } else {
                setTokenUrl('https://rakshak-net.proxy/secure-portal/auth-recovery?tkn=' + Math.random().toString(36).substr(2, 9));
            }
            setIsGenerating(false);
        }, 1500);
    };

    const handleCopy = () => {
        if (tokenUrl) {
            navigator.clipboard.writeText(tokenUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const simulateClick = () => {
        if (!tokenUrl) return;
        setSimulating(true);
        
        setTimeout(() => {
            const loc = HIGH_RISK_LOCATIONS[Math.floor(Math.random() * HIGH_RISK_LOCATIONS.length)];
            setBreachData(loc);
            
            // Inject threat into Global Map
            const newThread: Thread = {
                id: 'honey_' + Date.now(),
                senderName: `UNKNOWN_ACTOR_${Math.floor(Math.random() * 1000)}`,
                source: 'email',
                classification: 'scam',
                isIntercepted: false,
                persona: 'default',
                autoReported: false,
                isScanning: false,
                isCompromised: false,
                messages: [{ id: 'm1', sender: 'system', content: 'Tracking token triggered.', timestamp: Date.now() }],
                detectedLocation: loc,
                intent: 'IDENTITY_THEFT',
                threatScore: 99,
                scenarioId: 'custom',
                isArchived: false
            };
            
            setThreads(prev => [newThread, ...prev]);
            setSimulating(false);
        }, 2500);
    };

    return (
        <div className="forensics-container" style={{ padding: '2rem', color: '#e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                <div style={{ background: '#ef4444', padding: '12px', borderRadius: '8px' }}>
                    <Target size={24} color="#fff" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>Honey Tokens</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Embed active trackers in documents or links to identify scam sources</p>
                </div>
            </div>

            <div className="lab-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="sys-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Cpu size={16} /> TRACKER TYPE
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => setTokenType('PDF')}
                                style={{
                                    padding: '1rem',
                                    background: tokenType === 'PDF' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${tokenType === 'PDF' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                    color: tokenType === 'PDF' ? '#ef4444' : '#94a3b8',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <FileText size={24} />
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>SAFE TRACKED PDF</span>
                            </button>
                            <button
                                onClick={() => setTokenType('LINK')}
                                style={{
                                    padding: '1rem',
                                    background: tokenType === 'LINK' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${tokenType === 'LINK' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                    color: tokenType === 'LINK' ? '#ef4444' : '#94a3b8',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <LinkIcon size={24} />
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>TRACKING LINK</span>
                            </button>
                        </div>
                        
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: isGenerating ? 'rgba(239, 68, 68, 0.5)' : '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            {isGenerating ? <Activity className="spin-slow" size={18} /> : <Target size={18} />}
                            {isGenerating ? 'CREATING TRACKER...' : 'GENERATE TRACKER'}
                        </button>
                    </div>

                    {tokenUrl && (
                        <div className="sys-card" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', animation: 'slideDown 0.3s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', color: '#fca5a5', fontSize: '0.9rem' }}>TRACKER READY</h4>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Share this file or link with the sender. If they access it, their general location and network details will be recorded.</p>
                                </div>
                                <ShieldAlert color="#ef4444" size={24} />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <input 
                                    readOnly 
                                    value={tokenUrl} 
                                    style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                                Desk-Readability={true} />
                                <button onClick={handleCopy} style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff' }}>
                                    {copied ? <CheckCircle size={18} color="#10b981" /> : <Copy size={18} />}
                                </button>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                                    <strong>TESTING MODE:</strong> Since this is a restricted demo environment, click below to simulate what happens when the scammer opens your payload on their device.
                                </p>
                                <button 
                                    onClick={simulateClick}
                                    disabled={simulating || breachData !== null}
                                    style={{
                                        width: '100%', padding: '10px', background: 'transparent',
                                        border: '1px solid #f59e0b', color: '#fcd34d', borderRadius: '4px',
                                        fontWeight: 'bold', fontSize: '0.8rem', cursor: (simulating || breachData) ? 'not-allowed' : 'pointer',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {simulating ? <Radio className="spin-slow" size={16} /> : <Activity size={16} />}
                                    {simulating ? 'SIMULATING SCAM TRACE...' : 'SIMULATE SENDER CLICK'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Intelligence Feed */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="sys-card" style={{ flex: 1, padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Radio size={16} /> ACTIVE TRACKER FEED
                        </h3>
                        
                        {!simulating && !breachData && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', opacity: 0.3 }}>
                                <Radio size={64} style={{ marginBottom: '1rem' }} />
                                <p style={{ fontFamily: 'monospace' }}>AWAITING SCAM TRACE TRIGGER</p>
                            </div>
                        )}

                        {simulating && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#fca5a5' }}>
                                <Activity size={64} className="spin-slow" style={{ marginBottom: '1rem' }} />
                                <p style={{ fontFamily: 'monospace' }}>TRACING LOCATION...</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Retrieving network region and location details</p>
                            </div>
                        )}

                        {breachData && !simulating && (
                            <div style={{ animation: 'slideDown 0.4s ease-out' }}>
                                <div style={{ background: '#ef4444', color: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <ShieldAlert size={32} />
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>SCAM SOURCE TRACED</h2>
                                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Tracker opened successfully. Location identified.</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>TRACED NETWORK ADDRESS</div>
                                        <div style={{ fontSize: '1.1rem', color: '#fca5a5', fontFamily: 'monospace', fontWeight: 'bold' }}>{breachData.ip}</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.2rem' }}>LOCATION ACCURACY</div>
                                        <div style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 'bold' }}>98.4% (GPS MATCH)</div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: 'bold', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Fingerprint size={14} /> LOCATION PROFILE
                                    </div>
                                    <div style={{ padding: '1rem', display: 'grid', gap: '0.75rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                            <span style={{ color: '#64748b' }}>City / Region</span>
                                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{breachData.city}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                            <span style={{ color: '#64748b' }}>Country</span>
                                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{breachData.country}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                            <span style={{ color: '#64748b' }}>Exact Coordinates</span>
                                            <span style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{breachData.lat.toFixed(4)}, {breachData.lng.toFixed(4)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Device Type</span>
                                            <span style={{ color: '#fff' }}>Windows NT 10.0; Win64; x64</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                    <p style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={16} /> INCIDENT AUTOMATICALLY ADDED TO GLOBAL SAFETY MAP
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
