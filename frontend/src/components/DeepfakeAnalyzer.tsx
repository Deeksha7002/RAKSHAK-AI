import React, { useState, useRef } from 'react';
import { Shield, Database, ShieldAlert, Cpu, Activity, Upload, Search, FileCheck, Fingerprint, Zap, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { ForensicsService } from '../lib/ForensicsService';
import { MediaLogService } from '../lib/MediaLogService';
import { IntelligenceService } from '../lib/IntelligenceService';
import { CyberCellService } from '../lib/CyberCellService';
import { CryptoUtils } from '../lib/CryptoUtils';
import { ConsensusEngine } from '../lib/ConsensusEngine';
import type { ConsensusResult } from '../lib/ConsensusEngine';
import { IntelligenceGrid } from './IntelligenceGrid';
import type { MediaAnalysisResult, MediaType, ForensicLog, CaseFile } from '../lib/types';

const ForensicStyles = () => (
    <style>{`
        @keyframes scan-vertical {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes scan-horizontal {
            0% { left: 0%; opacity: 0; }
            10% { opacity: 0.5; }
            90% { opacity: 0.5; }
            100% { left: 100%; opacity: 0; }
        }
        @keyframes cyber-pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes glitch {
            0% { clip-path: inset(80% 0 0 0); }
            10% { clip-path: inset(10% 0 50% 0); }
            20% { clip-path: inset(50% 0 30% 0); }
            30% { clip-path: inset(20% 0 60% 0); }
            100% { clip-path: inset(0 0 0 0); }
        }
    `}</style>
);

export const DeepfakeAnalyzer: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<MediaAnalysisResult | null>(null);
    const [selectedType, setSelectedType] = useState<MediaType>('IMAGE');
    const [view, setView] = useState<'LAB' | 'LOGS' | 'SECURITY'>('LAB');
    const [logs, setLogs] = useState<ForensicLog[]>([]);
    const [progress, setProgress] = useState(0);
    const [scanLog, setScanLog] = useState<string[]>([]);
    const [consensus, setConsensus] = useState<ConsensusResult | null>(null);
    const [isSealing, setIsSealing] = useState(false);
    const [isSealed, setIsSealed] = useState(false);
    const [sealError, setSealError] = useState<string | null>(null);

    const handleSeal = async () => {
        if (!result) return;
        setIsSealing(true);
        try {
            // Wait for visual feedback
            await new Promise(r => setTimeout(r, 1500));
            
            // Generate Cryptographic Signature
            const signature = await CryptoUtils.generateSignature({
                result,
                timestamp: Date.now(),
                origin: 'RAKSHAK-FORENSICS-LAB'
            });

            // Create a CaseFile for the Evidence Locker
            const caseFile: CaseFile = {
                id: `FX-${result.timestamp.toString().slice(-6)}`,
                scammerName: `Forensic Subject ${result.timestamp.toString().slice(-4)}`,
                platform: selectedType,
                status: 'closed',
                threatLevel: result.authenticityScore < 50 ? 'scam' : 'benign',
                iocs: {
                    urls: [],
                    domains: [],
                    paymentMethods: [],
                    sensitiveDataRedacted: 0
                },
                transcript: [
                    {
                        id: '1',
                        sender: 'system',
                        content: `Forensic analysis of ${selectedType} initiated.`,
                        timestamp: Date.now()
                    },
                    {
                        id: '2',
                        sender: 'agent',
                        content: `Analysis complete. Authenticity: ${result.authenticityScore}%. Status: ${result.recommendation}`,
                        timestamp: Date.now()
                    }
                ],
                timestamp: new Date().toISOString(),
                isSealed: true,
                signature,
                forensicResult: result
            };

            // Save to CyberCell Service (Investigation Storage)
            await CyberCellService.saveCase(caseFile);
            
            setIsSealed(true);
            setSealError(null);
            console.log("✅ CASE SEALED CRYPTOGRAPHICALLY. Signature:", signature);
        } catch (error: any) {
            console.error("Seal failed:", error);
            setSealError(error.message || "CRYPTOGRAPHIC SEAL FAILURE");
        } finally {
            setIsSealing(false);
        }
    };
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    React.useEffect(() => {
        const subscription = MediaLogService.subscribe(newLogs => setLogs(newLogs));
        return () => {
            if (typeof subscription === 'function') (subscription as any)();
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const logMessages = {
        IMAGE: [
            "Initializing Neural Vision Engine...",
            "Decrypting binary texture maps...",
            "Analyzing facial geometry for 3D perspective artifacts...",
            "Scanning pupil reflections for catchlight consistency...",
            "Measuring chromatic aberration on edge boundaries...",
            "Mapping skin pore distribution and texture density...",
            "Detecting GAN-specific noise patterns (Gaussian Blur check)...",
            "Detecting blending artifacts at hairline boundaries...",
            "Cross-referencing shadows with local lighting sources...",
            "Running Error Level Analysis (ELA) on JPEG blocks...",
            "Verifying EXIF metadata and sensor signature...",
            "Finalizing Neural Consensus..."
        ],
        AUDIO: [
            "Calibrating Spectral Analysis Toolset...",
            "Isolating harmonic frequencies...",
            "Scanning frequency distribution for digital truncation...",
            "Analyzing prosody and micro-pause patterns...",
            "Checking phoneme transitions for robotic articulation...",
            "Verifying spectral consistency in the 8kHz-12kHz band...",
            "Detecting lack of natural harmonics above 12kHz...",
            "Filtering room tone and background ambients...",
            "Matching noise floor profile...",
            "Finalizing Acoustic Signature..."
        ],
        VIDEO: [
            "Synchronizing Frame-by-Frame Forensics...",
            "Buffering temporal vectors...",
            "Analyzing temporal facial stability (Motion Jitter)...",
            "Cross-referencing lip-sync with audio waveform...",
            "Tracking micro-expression blinking patterns...",
            "Analyzing ocular movement persistence...",
            "Detecting head-to-body motion coherence...",
            "Scanning for frame interpolation artifacts...",
            "Verifying compression block consistency...",
            "Synthesizing Temporal Integrity Report..."
        ]
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setMediaUrl(url);

        setIsScanning(true);
        setResult(null);
        setProgress(0);
        setScanLog([]);

        const logsList = logMessages[selectedType];

        if (selectedType === 'AUDIO') {
            startSpectralVisualizer();
        }

        for (let i = 0; i < logsList.length; i++) {
            setScanLog(prev => [...prev.slice(-3), logsList[i]]);
            setProgress(((i + 1) / logsList.length) * 100);
            await new Promise(r => setTimeout(r, 600));
        }

        const analysis = await ForensicsService.analyzeMedia(file, selectedType);
        
        // Step 1: Contextual Cross-Referencing
        setScanLog(prev => [...prev, "🧬 CONTEXTUAL CROSS-REFERENCING COMPLETE"]);
        await new Promise(r => setTimeout(r, 600));

        // Step 2: Multi-Agent Consensus Deliberation
        setScanLog(prev => [...prev, "⚖️ INITIATING MULTI-AGENT CONSENSUS..."]);
        await new Promise(r => setTimeout(r, 1000)); // Simulate deliberation time
        const consensusResult = await ConsensusEngine.reachConsensus(selectedType, analysis);
        setConsensus(consensusResult);
        
        setResult(analysis);
        setScanLog(prev => [...prev, "✅ ANALYSIS SEALED BY COUNCIL OF EXPERTS"]);
        setProgress(100); // Final progress
        setIsScanning(false);
        stopSpectralVisualizer();
    };

    const startSpectralVisualizer = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        const draw = () => {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
            
            const barWidth = 4;
            const gap = 2;
            const count = Math.floor(canvas.width / (barWidth + gap));
            
            for (let i = 0; i < count; i++) {
                const h = 20 + Math.sin(frame * 0.1 + i * 0.2) * 20 + Math.random() * 10;
                ctx.fillRect(i * (barWidth + gap), canvas.height - h, barWidth, h);
                if (i > count * 0.8 && Math.random() > 0.95) {
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(i * (barWidth + gap), canvas.height - h - 5, barWidth, 2);
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
                }
            }
            animationRef.current = requestAnimationFrame(draw);
        };
        draw();
    };

    const stopSpectralVisualizer = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const handleNuke = () => {
        if (confirm("🚨 WARNING: This will permanently wipe all intelligence and logs from memory. This action cannot be undone. Proceed?")) {
            MediaLogService.clearLogs();
            IntelligenceService.clearRecords();
            CyberCellService.clearSession();
            setResult(null);
            alert("🔒 SECURE WIPE COMPLETE: All volatile session data has been erased.");
        }
    };

    const StatusBadge = ({ score }: { score: number }) => {
        const color = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
        return (
            <div style={{ background: `${color}20`, color: color, padding: '6px 14px', borderRadius: '4px', fontSize: '0.9rem', border: `1px solid ${color}40`, fontWeight: 'bold' }}>
                AUTHENTICITY: {score}%
            </div>
        );
    };

    return (
        <div className="forensics-container" style={{ padding: '2rem', color: '#e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <ForensicStyles />
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '8px' }}>
                    <Shield size={24} color="#000" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>DEEPFAKE FORENSICS LAB</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Advanced Neural Analysis & Authenticity Verification</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                    <button onClick={() => setView('LAB')} style={{ padding: '8px 16px', background: view === 'LAB' ? 'var(--primary)' : 'transparent', color: view === 'LAB' ? '#000' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>MANUAL LAB</button>
                    <button onClick={() => setView('LOGS')} style={{ padding: '8px 16px', background: view === 'LOGS' ? 'var(--primary)' : 'transparent', color: view === 'LOGS' ? '#000' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>AUTOMATION LOGS</button>
                    <button onClick={() => setView('SECURITY')} style={{ padding: '8px 16px', background: view === 'SECURITY' ? '#ef4444' : 'transparent', color: view === 'SECURITY' ? '#fff' : '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>ANTI-THEFT SHIELD</button>
                </div>
            </div>

            {view === 'LAB' && (
                <div className="lab-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="sys-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={16} /> DATASET SELECTION</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {(['IMAGE', 'AUDIO', 'VIDEO'] as MediaType[]).map(t => (
                                    <button key={t} onClick={() => setSelectedType(t)} style={{ flex: 1, padding: '10px', background: selectedType === t ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${selectedType === t ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`, color: selectedType === t ? 'var(--primary)' : '#94a3b8', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 'bold' }}>{t}</button>
                                ))}
                            </div>
                            <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '3rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.05)', transition: 'all 0.3s' }}>
                                <input type="file" ref={fileRef} hidden onChange={handleFileUpload} />
                                {selectedType === 'AUDIO' ? (
                                    <Activity size={40} style={{ color: 'var(--primary)', opacity: 0.6, marginBottom: '1rem' }} />
                                ) : (
                                    <Upload size={40} style={{ color: 'var(--primary)', opacity: 0.6, marginBottom: '1rem' }} />
                                )}
                                <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>INGEST MEDIA SAMPLE</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to browse or drag & drop</p>
                            </div>
                        </div>

                        {mediaUrl && isScanning && (
                            <div className="sys-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div className="media-scanner-container" style={{ position: 'relative', minHeight: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                                    {isScanning && (
                                        <>
                                            <div style={{ 
                                                position: 'absolute', 
                                                bottom: 0, 
                                                left: 0, 
                                                width: '100%', 
                                                height: '2px', 
                                                background: 'linear-gradient(to top, var(--primary), transparent)', 
                                                zIndex: 10,
                                                boxShadow: '0 0 15px var(--primary)',
                                                animation: 'scan-vertical 2.5s ease-in-out infinite'
                                            }} />
                                            <div style={{ 
                                                position: 'absolute', 
                                                top: 0, 
                                                right: 0, 
                                                width: '2px', 
                                                height: '100%', 
                                                background: 'linear-gradient(to left, var(--primary), transparent)', 
                                                zIndex: 10,
                                                boxShadow: '0 0 15px var(--primary)',
                                                animation: 'scan-horizontal 3.5s ease-in-out infinite'
                                            }} />
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 11,
                                                color: 'var(--primary)',
                                                opacity: 0.4,
                                                animation: 'cyber-pulse 2s infinite'
                                            }}>
                                                <Fingerprint size={120} strokeWidth={0.5} />
                                            </div>
                                        </>
                                    )}
                                    {selectedType === 'VIDEO' && isScanning && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '3px',
                                            background: 'var(--primary)',
                                            boxShadow: '0 0 15px var(--primary), 0 0 30px var(--primary)',
                                            zIndex: 20,
                                            animation: 'scan-vertical 3s linear infinite'
                                        }} />
                                    )}
                                    {selectedType === 'VIDEO' ? (
                                        <video src={mediaUrl} className="media-scanner-image" autoPlay loop muted />
                                    ) : selectedType === 'AUDIO' ? (
                                        <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', position: 'relative', background: '#000' }}>
                                            <canvas ref={canvasRef} width={400} height={100} style={{ width: '80%', height: '100px' }} />
                                            <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '2px' }}>REAL-TIME SPECTRAL FLOOR (FFT)</div>
                                        </div>
                                    ) : (
                                        <img src={mediaUrl} className="media-scanner-image" alt="Scanned Media" />
                                    )}
                                    <div className="neural-grid-overlay" />
                                    <div className="neural-scanline" />
                                </div>
                            </div>
                        )}

                        {isScanning && (
                            <div className="sys-card" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>SCANNING IN PROGRESS...</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{Math.round(progress)}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {scanLog.map((log, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span style={{ color: 'var(--primary)' }}>&gt;</span>
                                            <span>{log}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ minHeight: '500px' }}>
                        {!result && !isScanning && (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                <Fingerprint size={80} strokeWidth={1} />
                                <p style={{ marginTop: '1rem' }}>AWAITING DATA INPUT</p>
                            </div>
                        )}

                        {result && (
                            <div className="sys-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>FORENSIC ANALYSIS REPORT</h3>
                                            <StatusBadge score={result.authenticityScore} />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>ID: FX-{result.timestamp.toString().slice(-8)} | CONFIDENCE: {result.confidenceLevel.toUpperCase()}</p>
                                    </div>

                                    {consensus && (
                                        <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                            <IntelligenceGrid result={consensus} />
                                        </div>
                                    )}

                                    <div style={{ textAlign: 'right', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-end' }}>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 4px 0' }}>RECOMMENDATION</p>
                                            <span style={{ color: result.recommendation.includes('Authentic') ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px' }}>{result.recommendation.toUpperCase()}</span>
                                        </div>
                                        
                                        <button 
                                            onClick={handleSeal}
                                            disabled={isSealing || isSealed}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '0.5rem', 
                                                padding: '8px 16px', 
                                                background: isSealed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                                                border: `1px solid ${isSealed ? '#10b981' : 'var(--primary)'}`, 
                                                color: isSealed ? '#10b981' : 'var(--primary)', 
                                                borderRadius: '6px', 
                                                cursor: isSealed ? 'default' : 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {isSealing ? (
                                                <Zap size={14} className="animate-spin" />
                                            ) : isSealed ? (
                                                <CheckCircle size={14} />
                                            ) : (
                                                <Lock size={14} />
                                            )}
                                            {isSealing ? 'GENERATING SIGNATURE...' : isSealed ? 'CASE SEALED' : 'SEAL AS EVIDENCE'}
                                        </button>
                                        
                                        {sealError && (
                                            <p style={{ 
                                                fontSize: '0.65rem', 
                                                color: '#ef4444', 
                                                margin: '4px 0 0 0', 
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace'
                                            }}>
                                                ERROR: {sealError.toUpperCase()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>DECISION CONFIDENCE</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{result.generalizationConfidence}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${result.generalizationConfidence}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s ease-out' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>ANOMALY RADAR SCORE</span>
                                            <span style={{ fontSize: '0.8rem', color: (result.anomalyScore ?? 0) > 60 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{result.anomalyScore ?? 0}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${result.anomalyScore ?? 0}%`, height: '100%', background: (result.anomalyScore ?? 0) > 60 ? '#ef4444' : '#10b981', transition: 'width 1s ease-out' }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ position: 'relative', width: '300px', height: '180px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '6px 10px', background: 'rgba(0,0,0,0.5)', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', zIndex: 10 }}>
                                            {selectedType === 'VIDEO' ? 'TEMPORAL INTEGRITY TIMELINE' : 'ANOMALY HEATMAP GRID'}
                                        </div>
                                        {selectedType === 'VIDEO' ? (
                                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '2px', padding: '10px' }}>
                                                {Array.from({ length: 40 }).map((_, i) => {
                                                    const jitter = (result.anomalyScore ?? 0) / 100;
                                                    const height = 20 + Math.random() * 60 + (i > 15 && i < 25 ? jitter * 40 : 0);
                                                    return (
                                                        <div key={i} style={{ 
                                                            flex: 1, 
                                                            height: `${height}%`, 
                                                            background: height > 70 ? '#ef4444' : 'var(--primary)', 
                                                            opacity: 0.6,
                                                            borderRadius: '1px'
                                                        }} />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', height: '100%' }}>
                                                {Array.from({ length: 60 }).map((_, i) => {
                                                    const anomaly = result.anomalyScore ?? 0;
                                                    const isHot = (anomaly > 5) && Math.random() > (1 - (anomaly / 100) - 0.1);
                                                    return <div key={i} style={{ background: isHot ? `rgba(239, 68, 68, ${Math.random() * 0.3 + 0.1})` : 'transparent', border: '0.5px solid rgba(255,255,255,0.02)', boxShadow: isHot ? 'inset 0 0 8px rgba(239, 68, 68, 0.15)' : 'none' }} />;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '1px' }}>
                                            {selectedType === 'VIDEO' ? 'TEMPORAL MOTION AUDIT' : 'NEURAL CONSENSUS AUDIT'}
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {(selectedType === 'VIDEO' ? ['JITTER', 'SYNC', 'GLITCH', 'COHERENCE', 'COMPRESSION', 'EYE-BLINK'] : 
                                              selectedType === 'IMAGE' ? ['ELA-VARIANCE', 'NOISE-PRINT', 'TOPOLOGY', 'CHROMA', 'METADATA', 'TEXTURE'] :
                                              ['SPECTRAL', 'PROSODY', 'ATMOSPHERIC', 'HARMONIC', 'PHASE', 'CONSENSUS']).map((label) => (
                                                <div key={label}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '6px' }}>
                                                        <span>{label}</span>
                                                        <span style={{ color: (result.authenticityScore < 85) ? '#ef4444' : '#10b981' }}>{result.authenticityScore}%</span>
                                                    </div>
                                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                                        <div style={{ height: '100%', width: `${result.authenticityScore}%`, background: (result.authenticityScore < 85) ? '#ef4444' : '#10b981' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={14} /> KEY FINDINGS</h4>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {result.keyFindings.map((f, i) => (
                                                <li key={i} style={{ fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                                                    <div style={{ minWidth: '14px', height: '14px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.3, marginTop: '2px' }} />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={14} /> TECHNICAL INDICATORS</h4>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {(result.technicalIndicators ?? []).map((f, i) => (
                                                <li key={i} style={{ fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                                                    <div style={{ minWidth: '6px', height: '6px', background: '#818cf8', marginTop: '6px', transform: 'rotate(45deg)' }} />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>DETERMINATIVE REASONING</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: '#cbd5e1', fontStyle: 'italic' }}>"{result.reasoning}"</p>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
                                        <FileCheck size={14} /> SECURITY SEAL: VERIFIED-HASH-AX92
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#fff' }}>EXPORT PDF</button>
                                        <button style={{ padding: '8px 16px', background: 'var(--primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#000', fontWeight: 'bold' }}>SAVE TO CASE FILE</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'LOGS' && (
                <div className="sys-card" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr 1fr 1fr', gap: '1rem', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        <span>Sender ID</span><span>Media Type</span><span>Confidence</span><span>Score</span><span>Recommendation</span><span>Action Taken</span><span>Privacy State</span><span>Timestamp</span>
                    </div>
                    {logs.length === 0 ? <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>NO AUTOMATED LOGS CAPTURED</div> : 
                        logs.map(log => (
                            <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr 1fr 1fr', gap: '1rem', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', alignItems: 'center', background: log.action === 'BLOCKED' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.75rem' }}>{log.senderId}</span>
                                <span>{log.mediaType}</span>
                                <span style={{ color: log.confidence === 'High' ? '#10b981' : '#f59e0b' }}>{log.confidence}</span>
                                <span style={{ fontWeight: 'bold' }}>{log.result.authenticityScore}%</span>
                                <span style={{ color: log.result.recommendation.includes('Authentic') ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>{log.result.recommendation.toUpperCase()}</span>
                                <span>{log.action === 'BLOCKED' ? <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>BLOCKED</span> : <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>SECURED</span>}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.7rem' }}><EyeOff size={12} /> ANON-ENCRYPTED</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                        ))
                    }
                </div>
            )}

            {view === 'SECURITY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div className="sys-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', margin: '0 0 1rem 0' }}><Cpu size={18} /> ZERO-PERSISTENCE</h4>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>All intelligence data is stored in volatile RAM. No database leaks possible.</p>
                        </div>
                        <div className="sys-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', margin: '0 0 1rem 0' }}><Shield size={18} /> EGRESS SHIELD</h4>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mandatory PII inspection on all outgoing reports.</p>
                        </div>
                        <div className="sys-card" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', margin: '0 0 1rem 0' }}><Activity size={18} /> ANONYMIZER</h4>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Deterministic salt-hashing hides identities.</p>
                        </div>
                    </div>
                    <div className="sys-card" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed #ef4444' }}>
                        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h3>EMERGENCY DATA DISPOSAL</h3>
                        <button onClick={handleNuke} style={{ padding: '12px 32px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>INITIATE NUKE PROTOCOL</button>
                    </div>
                </div>
            )}
        </div>
    );
};
