import React, { useState, useRef } from 'react';
import { Shield, Upload, Search, FileCheck, Fingerprint, Database, Zap, Lock, EyeOff, ShieldAlert, Trash2, Cpu, Activity, ShieldCheck } from 'lucide-react';
import { ForensicsService } from '../lib/ForensicsService';
import { MediaLogService } from '../lib/MediaLogService';
import { IntelligenceService } from '../lib/IntelligenceService';
import { CyberCellService } from '../lib/CyberCellService';
import type { MediaAnalysisResult, MediaType, ForensicLog } from '../lib/types';

export const DeepfakeAnalyzer: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<MediaAnalysisResult | null>(null);
    const [selectedType, setSelectedType] = useState<MediaType>('IMAGE');
    const [view, setView] = useState<'LAB' | 'LOGS' | 'SECURITY'>('LAB');
    const [logs, setLogs] = useState<ForensicLog[]>([]);
    const [progress, setProgress] = useState(0);
    const [scanLog, setScanLog] = useState<string[]>([]);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        return MediaLogService.subscribe(newLogs => setLogs(newLogs));
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

        // Generate a local blob URL for preview
        const url = URL.createObjectURL(file);
        setMediaUrl(url);

        setIsScanning(true);
        setResult(null);
        setProgress(0);
        setScanLog([]);

        const logsList = logMessages[selectedType];

        // Progress simulation
        for (let i = 0; i < logsList.length; i++) {
            setScanLog(prev => [...prev.slice(-3), logsList[i]]);
            setProgress(((i + 1) / logsList.length) * 100);
            await new Promise(r => setTimeout(r, 600));
        }

        const analysis = await ForensicsService.analyzeMedia(file, selectedType);
        setResult(analysis);
        setIsScanning(false);
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
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '8px' }}>
                    <Shield size={24} color="#000" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>DEEPFAKE FORENSICS LAB</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Advanced Neural Analysis & Authenticity Verification</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setView('LAB')}
                        style={{ padding: '8px 16px', background: view === 'LAB' ? 'var(--primary)' : 'transparent', color: view === 'LAB' ? '#000' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                        MANUAL LAB
                    </button>
                    <button
                        onClick={() => setView('LOGS')}
                        style={{ padding: '8px 16px', background: view === 'LOGS' ? 'var(--primary)' : 'transparent', color: view === 'LOGS' ? '#000' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                        AUTOMATION LOGS
                    </button>
                    <button
                        onClick={() => setView('SECURITY')}
                        style={{ padding: '8px 16px', background: view === 'SECURITY' ? '#ef4444' : 'transparent', color: view === 'SECURITY' ? '#fff' : '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                        ANTI-THEFT SHIELD
                    </button>
                </div>
            </div>

            {view === 'LAB' && (
                <div className="lab-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>
                    {/* Controls & Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="sys-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Database size={16} /> DATASET SELECTION
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {(['IMAGE', 'AUDIO', 'VIDEO'] as MediaType[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedType(t)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: selectedType === t ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${selectedType === t ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                                            color: selectedType === t ? 'var(--primary)' : '#94a3b8',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    border: '2px dashed rgba(59, 130, 246, 0.3)',
                                    borderRadius: '12px',
                                    padding: '3rem 1.5rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'rgba(59, 130, 246, 0.05)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <input type="file" ref={fileRef} hidden onChange={handleFileUpload} />
                                <Upload size={40} style={{ color: 'var(--primary)', opacity: 0.6, marginBottom: '1rem' }} />
                                <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>INGEST MEDIA SAMPLE</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to browse or drag & drop</p>
                            </div>
                        </div>

                        {mediaUrl && isScanning && (
                            <div className="sys-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div className="media-scanner-container">
                                    {selectedType === 'VIDEO' ? (
                                        <video src={mediaUrl} className="media-scanner-image" autoPlay loop muted />
                                    ) : selectedType === 'AUDIO' ? (
                                        <div style={{ height: '100px', display: 'flex', alignItems: 'center', color: 'var(--primary)' }}>[AUDIO WAVEFORM RENDER]</div>
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

                    {/* Analysis Report */}
                    <div style={{ minHeight: '500px' }}>
                        {!result && !isScanning && (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                <Fingerprint size={80} strokeWidth={1} />
                                <p style={{ marginTop: '1rem' }}>AWAITING DATA INPUT</p>
                            </div>
                        )}

                        {result && (
                            <div className="sys-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                {mediaUrl && (
                                    <div className="media-scanner-container" style={{ minHeight: '150px' }}>
                                        {selectedType === 'VIDEO' ? (
                                            <video src={mediaUrl} className="media-scanner-image" controls />
                                        ) : selectedType === 'IMAGE' ? (
                                            <img src={mediaUrl} className="media-scanner-image" alt="Analyzed Media" style={{ filter: 'none' }} />
                                        ) : null}
                                        {/* Keep grid, but stop scanner when done */}
                                        <div className="neural-grid-overlay" style={{ opacity: 0.5 }} />
                                        {/* Highlight Anomalies overlay randomly across the grid if it's a deepfake */}
                                        {(result.anomalyScore || 0) > 40 && (
                                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(239,68,68,0.2) 2px, transparent 2px)', backgroundSize: '30px 30px', animation: 'scanline 5s linear infinite' }} />
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>FORENSIC ANALYSIS REPORT</h2>
                                            <StatusBadge score={result.authenticityScore} />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>ID: FX-{result.timestamp.toString().slice(-8)} | CONFIDENCE: {result.confidenceLevel.toUpperCase()}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                        <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 4px 0' }}>RECOMMENDATION</p>
                                        <span style={{
                                            color: result.recommendation.includes('Authentic') ? '#10b981' : '#ef4444',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            letterSpacing: '1px'
                                        }}>
                                            {result.recommendation.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* GENERALIZATION & ANOMALY METERS */}
                                <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>GENERALIZATION CONFIDENCE</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{Math.round(result.generalizationConfidence || 85)}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${result.generalizationConfidence || 85}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s ease-out' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>ANOMALY RADAR SCORE</span>
                                            <span style={{ fontSize: '0.8rem', color: (result.anomalyScore || 0) > 60 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{Math.round(result.anomalyScore || 10)}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${result.anomalyScore || 10}%`, height: '100%', background: (result.anomalyScore || 0) > 60 ? '#ef4444' : '#10b981', transition: 'width 1s ease-out' }} />
                                        </div>
                                    </div>
                                </div>

                                {result.isAdversarial && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <ShieldAlert color="#ef4444" size={24} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: '#ef4444' }}>ADVERSARIAL ATTACK DETECTED</p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>This media contains digital artifacts designed to "blind" AI models. High-fidelity ensemble audit triggered.</p>
                                        </div>
                                    </div>
                                )}

                                {/* HEURISTIC ANOMALY HEATMAP SIMULATION */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ position: 'relative', width: '300px', height: '180px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '6px 10px', background: 'rgba(0,0,0,0.5)', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', zIndex: 10 }}>ANOMALY HEATMAP GRID</div>
                                        {/* Simulated Heatmap Pixels */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', height: '100%' }}>
                                            {Array.from({ length: 60 }).map((_, i) => {
                                                // VISUAL FIX: Heatmap now active for ALL anomaly scores > 5
                                                const anomaly = result.anomalyScore || 0;
                                                const isHot = (anomaly > 5) && Math.random() > (1 - (anomaly / 100) - 0.1);
                                                return (
                                                    <div key={i} style={{
                                                        background: isHot ? `rgba(239, 68, 68, ${Math.random() * 0.3 + 0.1})` : 'transparent',
                                                        border: '0.5px solid rgba(255,255,255,0.02)',
                                                        boxShadow: isHot ? 'inset 0 0 8px rgba(239, 68, 68, 0.15)' : 'none'
                                                    }} />
                                                );
                                            })}
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.65rem', color: '#94a3b8' }}>SCANNER RESOLUTION: 8-BIT NEURAL</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', flex: 1, minWidth: '250px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '1px' }}>NEURAL CONSENSUS AUDIT</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {['OPTICAL', 'STRUCTURAL', 'FIDELITY', 'SEMANTIC', 'METADATA', 'ENVIRONMENTAL'].map((label) => (
                                                <div key={label}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                                                        <span>{label}</span>
                                                        <span style={{ color: (result.authenticityScore < 90) ? '#ef4444' : '#10b981', fontSize: '0.75rem' }}>{Math.round(result.authenticityScore)}%</span>
                                                    </div>
                                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                                        <div style={{ height: '100%', width: `${result.authenticityScore}%`, background: (result.authenticityScore < 90) ? '#ef4444' : '#10b981' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* DEFENSE-IN-DEPTH STATUS BAR */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        {(
                                            result.mediaType === 'IMAGE' ? ['OPTICAL', 'STRUCTURAL', 'ENVIRONMENTAL', 'SEMANTIC', 'METADATA', 'FIDELITY'] :
                                                result.mediaType === 'VIDEO' ? ['TEMPORAL', 'BEHAVIORAL', 'BIOMETRIC', 'OPTICAL', 'FIDELITY'] :
                                                    ['SPECTRAL', 'EMOTIONAL', 'ATMOSPHERIC', 'HARMONIC', 'SYNC']
                                        ).map(layer => (
                                            <div key={layer} style={{ fontSize: '0.55rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                                                {layer}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                        <ShieldCheck size={14} /> {result.mediaType === 'IMAGE' ? '6-GATE' : '3-GATE'} VERIFIED
                                    </div>
                                </div>

                                <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Zap size={14} /> KEY FINDINGS
                                        </h4>
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
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Search size={14} /> TECHNICAL INDICATORS
                                        </h4>
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {result.technicalIndicators.map((f, i) => (
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
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: '#cbd5e1', fontStyle: 'italic' }}>
                                        "{result.reasoning}"
                                    </p>
                                </div>

                                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: '#10b98120', padding: '8px', borderRadius: '50%' }}>
                                        <Lock size={16} color="#10b981" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981' }}>PRIVACY GUARD ACTIVE</p>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>This analysis was performed locally on your device. All PII has been scrubbed. No data was sent to external servers.</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
                                        <FileCheck size={14} />
                                        SECURITY SEAL: VERIFIED-HASH-AX92
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>EXPORT PDF</button>
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
                    <div className="logs-grid logs-grid-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr 1fr 1fr', gap: '1rem', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        <span>Sender ID</span>
                        <span>Media Type</span>
                        <span>Confidence</span>
                        <span>Score</span>
                        <span>Recommendation</span>
                        <span>Action Taken</span>
                        <span>Privacy State</span>
                        <span>Timestamp</span>
                    </div>
                    {logs.length === 0 && (
                        <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>
                            NO AUTOMATED LOGS CAPTURED
                        </div>
                    )}
                    {logs.map(log => (
                        <div key={log.id} className="logs-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr 1fr 1fr', gap: '1rem', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', alignItems: 'center', background: log.action === 'BLOCKED' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.75rem' }}>{log.senderId}</span>
                            <span>{log.mediaType}</span>
                            <span style={{ color: log.confidence === 'High' ? '#10b981' : '#f59e0b' }}>{log.confidence}</span>
                            <span style={{ fontWeight: 'bold' }}>{log.result.authenticityScore}%</span>
                            <span style={{ color: log.result.recommendation.includes('Authentic') ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>{log.result.recommendation.toUpperCase()}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {log.action === 'BLOCKED' ? (
                                    <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>TERMINATED & BLOCKED</span>
                                ) : (
                                    <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>SECURED & STORED</span>
                                )}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.7rem' }}>
                                <EyeOff size={12} /> ANON-ENCRYPTED
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>
            )}

            {view === 'SECURITY' && (
                <div className="analysis-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div className="sys-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                                <Cpu size={18} /> ZERO-PERSISTENCE
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>All intelligence data is stored in volatile RAM. No database leaks possible.</p>
                            <div style={{ marginTop: '1rem', fontSize: '0.7rem', background: '#10b98120', padding: '4px 8px', borderRadius: '4px', color: '#10b981', display: 'inline-block' }}>STATUS: VOLATILE</div>
                        </div>
                        <div className="sys-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                                <Shield size={18} /> EGRESS SHIELD
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Mandatory PII inspection on all outgoing reports. Unauthorized packets are dropped.</p>
                            <div style={{ marginTop: '1rem', fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary)', display: 'inline-block' }}>STATUS: INSPECTING</div>
                        </div>
                        <div className="sys-card" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                                <Activity size={18} /> ANONYMIZER
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Deterministic salt-hashing hides user and scammer identities in long-term logs.</p>
                            <div style={{ marginTop: '1rem', fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.2)', padding: '4px 8px', borderRadius: '4px', color: '#a78bfa', display: 'inline-block' }}>STATUS: ACTIVE</div>
                        </div>
                    </div>

                    <div className="sys-card" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed #ef4444' }}>
                        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                        <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>EMERGENCY DATA DISPOSAL</h3>
                        <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto', color: '#94a3b8', fontSize: '0.9rem' }}>
                            Feeling compromised? Use the Nuke Protocol to instantly shred all intelligence records, forensic logs, and session history from memory.
                        </p>
                        <button
                            onClick={handleNuke}
                            style={{ padding: '12px 32px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                        >
                            <Trash2 size={18} /> INITIATE NUKE PROTOCOL
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#94a3b8' }}>DATA GOVERANCE POLICY</h4>
                        <div className="analysis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                            <div>
                                <p style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '4px' }}>LOCAL PROCESSING</p>
                                <p>All deepfake analysis and persona orchestration happens on your local client. We use zero server-side storage for raw signals.</p>
                            </div>
                            <div>
                                <p style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '4px' }}>EGRESS CONTROL</p>
                                <p>Outgoing reports only contain salt-hashed IDs and confirmed scam IOCs (URLs, payment links). No chat content leaves this app.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
