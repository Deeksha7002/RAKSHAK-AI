import React, { useEffect, useState } from 'react';
import { Shield, Wifi, MapPin } from 'lucide-react';
import type { GeoLocation, NeuralMatrix } from '../lib/types';
import { TacticalIntelligenceGraph } from './TacticalIntelligenceGraph';

interface LiveInterceptProps {
    intent: string;
    threatScore: number; // 0-100
    isScanning: boolean;
    counterMeasure: string;
    location?: GeoLocation;
    neuralMatrixHistory?: NeuralMatrix[];
}

export const LiveIntercept: React.FC<LiveInterceptProps> = ({ intent, threatScore, isScanning, counterMeasure, location, neuralMatrixHistory }) => {
    // Force usage to satisfy aggressive linter
    // console.log("Debug LiveIntercept:", intent, threatScore, isScanning, counterMeasure, location);

    // Simulated waveform bars
    const [bars, setBars] = useState<number[]>(new Array(20).fill(10));
    const [traceProgress, setTraceProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBars(prev => prev.map(() => Math.random() * 40 + 10));
        }, 100);

        // Simulate tracing progress
        if (location && traceProgress < 100) {
            const traceInterval = setInterval(() => {
                setTraceProgress(prev => Math.min(100, prev + 5));
            }, 200);
            return () => {
                clearInterval(interval);
                clearInterval(traceInterval);
            };
        }

        return () => clearInterval(interval);
        // Add all dependencies to satisfy linter
    }, [location, traceProgress]);

    const getColor = () => {
        if (threatScore > 80) return 'var(--status-danger)';
        if (threatScore > 50) return 'var(--status-warning)';
        return 'var(--primary)';
    };

    return (
        <div className="live-intercept-panel" style={{
            background: 'rgba(10, 16, 29, 0.95)',
            borderBottom: `2px solid ${getColor()}`,
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'border-color 0.5s ease'
        }}>
            {/* Background Grid Effect */}
            <div className="grid-bg" style={{ opacity: 0.1, pointerEvents: 'none' }} />

            {/* Top Row: Header & Status */}
            <div className="live-intercept-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="live-indicator">
                        <div className="dot" /> LIVE INTERCEPT
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Wifi size={14} className="animate-pulse" /> MONITORING ENCRYPTED CHANNEL
                    </div>
                </div>

                <div className="threat-score-badge" style={{
                    background: getColor(),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: `0 0 15px ${getColor()}`
                }}>
                    <Shield size={16} />
                    THREAT LEVEL: {threatScore}%
                </div>
            </div>

            {/* Middle Row: Waveform & Analysis */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', minHeight: '60px' }}>
                {/* Visualizer */}
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '100%', flex: '0 0 150px' }}>
                    {bars.map((h, i) => (
                        <div key={i} style={{
                            width: '4px',
                            height: `${h}%`,
                            background: getColor(),
                            borderRadius: '2px',
                            transition: 'height 0.1s ease'
                        }} />
                    ))}
                </div>

                {/* AI Analysis Cards */}
                <div className="live-intercept-info-cards" style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div className="analysis-card">
                        <div className="label">DETECTED INTENT</div>
                        <div className="value text-warning">{intent || "ANALYZING..."}</div>
                    </div>
                    <div className="analysis-card">
                        <div className="label">SOURCE ORIGIN</div>
                        {location ? (
                            <div className="value" style={{ color: traceProgress === 100 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                                {traceProgress === 100 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={12} /> {location.city}, {location.country}
                                    </div>
                                ) : (
                                    <span>TRACING... {traceProgress}%</span>
                                )}
                            </div>
                        ) : (
                            <div className="value text-muted">UNKNOWN</div>
                        )}
                    </div>
                    <div className="analysis-card">
                        <div className="label">IP ADDRESS</div>
                        <div className="value" style={{ fontFamily: 'monospace' }}>
                            {location && traceProgress === 100 ? location.ip : "---.---.---.---"}
                        </div>
                    </div>
                    <div className="analysis-card">
                        <div className="label">ACTION: {counterMeasure}</div>
                        <div className="value" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            {isScanning ? "Processing..." : "Active"}
                        </div>
                    </div>

                    {/* New Financial Intel Card */}
                    <div className="analysis-card" style={{ borderColor: location?.financials?.flagged ? 'var(--status-danger)' : 'rgba(255,255,255,0.1)' }}>
                        <div className="label">FINANCIAL ID (DECRYPTED)</div>
                        {location?.financials ? (
                            <div className="value" style={{ color: location.financials.flagged ? '#fca5a5' : 'white' }}>
                                <div>{location.financials.method}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{location.financials.identifier}</div>
                            </div>
                        ) : (
                            <div className="value text-muted">SCANNING...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tactical Intelligence Graph */}
            <TacticalIntelligenceGraph
                history={neuralMatrixHistory ?? []}
            />

            <style>{`
                .live-intercept-panel {
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .live-indicator {
                    color: var(--status-danger);
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }
                .dot {
                    width: 8px;
                    height: 8px;
                    background: var(--status-danger);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--status-danger);
                    animation: pulse 1s infinite;
                }
                .analysis-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    flex: 1;
                    min-width: 0;
                }
                .analysis-card .label {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .analysis-card .value {
                    font-family: var(--font-mono);
                    font-weight: 600;
                    font-size: 0.85rem;
                    white-space: normal;
                    line-height: 1.1;
                    word-break: break-word;
                }
                .text-warning { color: var(--status-warning); }
                .text-primary { color: var(--primary); }
            `}</style>
        </div>
    );
};
