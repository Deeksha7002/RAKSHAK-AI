import React, { useState } from 'react';

import { Shield, ShieldAlert, CheckCircle, AlertTriangle, Play, RefreshCw, Terminal, Search, Zap } from 'lucide-react';

export const DemoConsole: React.FC = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<any | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [agentResponse, setAgentResponse] = useState<{response: string, persona: string} | null>(null);
    const [generatingReply, setGeneratingReply] = useState(false);

    const handleAnalyze = async () => {
        if (!input.trim()) return;
        setAnalyzing(true);
        setResult(null);
        setAgentResponse(null);
        setError(null);

        try {
            const token = localStorage.getItem('rakshak_access_token');
            if (!token) {
                setError("Authentication required. Please sign in or register to use the Simulation Lab.");
                setAnalyzing(false);
                return;
            }
            
            // Use relative path to hit Vercel proxy, which now correctly routes to Render
            const res = await fetch(`/api/analyze?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Auth-Token': token || ''
                },
                body: JSON.stringify({
                    text: input,
                    conversation_id: "demo-lab",
                    context: "{\"is_demo\": true}"
                })
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Backend Analysis:", data);
                setResult(data);
                setAnalyzing(false); // Show verdict immediately
                
                // Now fetch what the agent would actually reply
                setGeneratingReply(true);
                try {
                    const replyRes = await fetch(`/api/generate-response?token=${token}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'X-Auth-Token': token || ''
                        },
                        body: JSON.stringify({
                            message: input,
                            classification: data.classification,
                            sender_name: "Demo User",
                            conversation_history: []
                        })
                    });
                    if (replyRes.ok) {
                        const replyData = await replyRes.json();
                        setAgentResponse(replyData);
                    } else {
                        const errText = await replyRes.text();
                        console.error("Agent response threw status", replyRes.status, errText);
                        setAgentResponse({ response: `API Error ${replyRes.status}: ${errText}`, persona: "error" });
                    }
                } catch (replyErr: any) {
                    console.error("Agent response generation failed in demo:", replyErr);
                    setAgentResponse({ response: `Network Error: ${replyErr.message}`, persona: "network_error" });
                } finally {
                    setGeneratingReply(false);
                }

            } else {
                const errText = await res.text();
                console.error("Analysis failed", res.status, errText);
                setError(`Server Error ${res.status}: ${errText}`);
                setAnalyzing(false);
            }
        } catch (e) {
            console.error("Connection error", e);
            setError("Could not connect to the Rakshak Core. Ensure the backend is running.");
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setInput('');
        setResult(null);
        setAgentResponse(null);
        setError(null);
    };

    return (
        <div className="demo-console-container" style={{ padding: '2rem', color: '#e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                <div style={{ background: '#8b5cf6', padding: '12px', borderRadius: '8px' }}>
                    <Terminal size={24} color="#fff" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>THREAT SIMULATION LAB</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Manual heuristic verification environment</p>
                    {/* 🛠️ Temporary Debug Force-Sign-Out Button */}
                    <button 
                        onClick={() => { localStorage.clear(); window.location.reload(); }}
                        style={{
                            background: '#ef4444', color: 'white', border: 'none', 
                            padding: '6px 12px', borderRadius: '4px', marginTop: '10px', 
                            fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
                        }}
                    >
                        🚨 FORCE SIGN OUT & RESET
                    </button>
                </div>
            </div>

            <div className="lab-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1 }}>
                {/* Input Section */}
                <div className="sys-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1rem', color: '#a78bfa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={16} /> INPUT VECTOR
                    </h3>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste suspicious text, email content, or SMS message here to test the detection engine..."
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '1rem',
                            color: '#fff',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            resize: 'none',
                            outline: 'none',
                            marginBottom: '1.5rem'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing || generatingReply || !input.trim()}
                            className="btn"
                            style={{
                                flex: 1,
                                background: (analyzing || generatingReply) ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6',
                                color: 'white', border: 'none',
                                padding: '12px',
                                fontWeight: 'bold',
                                opacity: (analyzing || generatingReply || !input.trim()) ? 0.7 : 1,
                                cursor: (analyzing || generatingReply || !input.trim()) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {(analyzing || generatingReply) ? (
                                <><RefreshCw className="spin-slow" size={18} /> PROCESSING...</>
                            ) : (
                                <><Play size={18} /> RUN ANALYSIS</>
                            )}
                        </button>
                        <button
                            onClick={handleReset}
                            className="btn"
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                        >
                            CLEAR
                        </button>
                    </div>
                </div>

                {/* proper Analysis Output */}
                <div className="sys-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '1rem', color: '#a78bfa', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={16} /> ENGINE OUTPUT
                    </h3>

                    {!result && !analyzing && !error && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.3 }}>
                            <Shield size={64} style={{ marginBottom: '1rem' }} />
                            <p>WAITING FOR INPUT</p>
                        </div>
                    )}

                    {error && !analyzing && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fca5a5', textAlign: 'center', padding: '1rem' }}>
                            <AlertTriangle size={48} style={{ marginBottom: '1rem' }} />
                            <p style={{ fontWeight: 'bold' }}>ANALYSIS FAILED</p>
                            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{error}</p>
                        </div>
                    )}

                    {analyzing && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <div className="scan-bar-bg" style={{ width: '200px', marginBottom: '1rem' }}>
                                <div className="scan-bar-fill" style={{ width: '100%', animation: 'scan 1s infinite linear', background: '#8b5cf6' }} />
                            </div>
                            <p style={{ color: '#a78bfa', fontFamily: 'monospace' }}>HEURISITC SCAN IN PROGRESS...</p>
                        </div>
                    )}

                    {result && !analyzing && (
                        <div style={{ animation: 'slideDown 0.3s ease-out' }}>
                            <div style={{
                                padding: '1.5rem',
                                borderRadius: '8px',
                                background: result.classification === 'scam' ? 'rgba(239, 68, 68, 0.1)' :
                                    result.classification === 'likely_scam' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: `1px solid ${result.classification === 'scam' ? '#ef4444' :
                                    result.classification === 'likely_scam' ? '#f59e0b' : '#10b981'
                                    }`,
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div>
                                    {result.classification === 'scam' ? <ShieldAlert size={32} color="#ef4444" /> :
                                        result.classification === 'likely_scam' ? <AlertTriangle size={32} color="#f59e0b" /> :
                                            <CheckCircle size={32} color="#10b981" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold' }}>VERDICT</div>
                                    <div style={{
                                        fontSize: '1.5rem', fontWeight: 'bold',
                                        color: result.classification === 'scam' ? '#ef4444' :
                                            result.classification === 'likely_scam' ? '#f59e0b' : '#10b981'
                                    }}>
                                        {result.classification === 'scam' ? 'MALICIOUS THREAT DETECTED' :
                                            result.classification === 'likely_scam' ? 'SUSPICIOUS ACTIVITY' : 'SAFE'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>DETECTED INTENT</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>{result.intent}</div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>CAPTURED INDICATORS (IOCs)</h4>
                                {result.iocs && result.iocs.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {result.iocs.map((ioc: string, i: number) => (
                                            <span key={i} style={{
                                                fontSize: '0.75rem',
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                color: '#fca5a5',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(239, 68, 68, 0.3)'
                                            }}>
                                                {ioc}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>No specific IOCs extracted from this sample.</div>
                                )}
                            </div>

                            {generatingReply && !agentResponse && (
                                <div style={{ 
                                    marginTop: '1.5rem', 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    padding: '1rem', 
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    color: '#a78bfa'
                                }}>
                                    <RefreshCw size={20} className="spin-slow" />
                                    <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>Rakshak AI is drafting a response...</span>
                                </div>
                            )}

                            {agentResponse && (
                                <div style={{ 
                                    marginTop: '1.5rem', 
                                    background: 'rgba(139, 92, 246, 0.1)', 
                                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                                    padding: '1.5rem', 
                                    borderRadius: '8px',
                                    animation: 'slideDown 0.4s ease-out'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div style={{ background: '#8b5cf6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            RAKSHAK AI
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#a78bfa' }}>
                                            PERSONA: {agentResponse.persona?.toUpperCase() || 'DEFAULT'}
                                        </div>
                                    </div>
                                    <div style={{ color: '#fff', fontSize: '1rem', fontStyle: 'italic', borderLeft: '3px solid #8b5cf6', paddingLeft: '1rem', marginTop: '0.5rem' }}>
                                        "{agentResponse.response}"
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
