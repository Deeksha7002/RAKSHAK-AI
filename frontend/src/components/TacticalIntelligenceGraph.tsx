import React, { useEffect, useRef } from 'react';
import type { NeuralMatrix } from '../lib/types';

interface TacticalIntelligenceGraphProps {
    history: NeuralMatrix[];
    className?: string;
}

const METRICS: { key: keyof NeuralMatrix; label: string; color: string; glow: string }[] = [
    { key: 'financial_risk_node',       label: 'Financial Risk',  color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
    { key: 'coercion_risk_node',        label: 'Coercion',        color: '#ef4444', glow: 'rgba(239,68,68,0.5)'  },
    { key: 'urgency_spike_node',        label: 'Urgency',         color: '#fb923c', glow: 'rgba(251,146,60,0.5)' },
    { key: 'deception_complexity_node', label: 'Deception',       color: '#a855f7', glow: 'rgba(168,85,247,0.5)' },
];

const W = 460;  // SVG viewBox width
const H = 130;  // SVG viewBox height
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 16;

function toPoint(idx: number, total: number, value: number): { x: number; y: number } {
    const usableW = W - PAD_L - PAD_R;
    const usableH = H - PAD_T - PAD_B;
    const x = PAD_L + (total <= 1 ? usableW / 2 : (idx / (total - 1)) * usableW);
    const y = PAD_T + usableH - value * usableH;
    return { x, y };
}

function buildPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const cx = (points[i - 1].x + points[i].x) / 2;
        d += ` C ${cx},${points[i - 1].y} ${cx},${points[i].y} ${points[i].x},${points[i].y}`;
    }
    return d;
}

export const TacticalIntelligenceGraph: React.FC<TacticalIntelligenceGraphProps> = ({ history, className }) => {
    const animRef = useRef<SVGCircleElement>(null);

    useEffect(() => {
        const el = animRef.current;
        if (!el) return;
        el.style.opacity = '1';
        let frame = 0;
        const animate = () => {
            frame++;
            el.style.r = String(3 + Math.sin(frame / 8) * 2);
            el.style.opacity = String(0.6 + Math.sin(frame / 8) * 0.4);
            const id = requestAnimationFrame(animate);
            return id;
        };
        const id = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(id);
    }, [history.length]);

    const hasData = history.length >= 1;
    const total = history.length;

    return (
        <div className={className} style={{
            background: 'rgba(10, 15, 30, 0.8)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1rem 0.6rem',
            backdropFilter: 'blur(8px)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#818cf8',
                    fontFamily: 'var(--font-mono, monospace)',
                }}>
                    ⬡ Tactical Intent Graph
                </span>
                <span style={{
                    fontSize: '0.6rem',
                    color: '#475569',
                    fontFamily: 'var(--font-mono, monospace)',
                }}>
                    {total} intercept{total !== 1 ? 's' : ''}
                </span>
            </div>

            {/* SVG Graph */}
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: '110px', overflow: 'visible' }}
            >
                <defs>
                    {METRICS.map(m => (
                        <React.Fragment key={m.key}>
                            <linearGradient id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={m.color} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={m.color} stopOpacity="0.02" />
                            </linearGradient>
                            <filter id={`glow-${m.key}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </React.Fragment>
                    ))}
                    {/* Grid line pattern */}
                    <pattern id="grid" width="50" height="30" patternUnits="userSpaceOnUse">
                        <path d={`M 50 0 L 0 0 0 30`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    </pattern>
                </defs>

                {/* Grid background */}
                <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B} fill="url(#grid)" rx="2" />

                {/* Horizontal threshold lines */}
                {[0.25, 0.5, 0.75].map(val => {
                    const y = PAD_T + (H - PAD_T - PAD_B) * (1 - val);
                    return (
                        <line
                            key={val}
                            x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3,4"
                        />
                    );
                })}

                {/* Y-axis labels */}
                {[{ label: '100', val: 1 }, { label: '50', val: 0.5 }, { label: '0', val: 0 }].map(({ label, val }) => {
                    const y = PAD_T + (H - PAD_T - PAD_B) * (1 - val);
                    return (
                        <text
                            key={label}
                            x={PAD_L - 2}
                            y={y + 3}
                            textAnchor="end"
                            fill="rgba(100,116,139,0.6)"
                            fontSize="6"
                            fontFamily="monospace"
                        >
                            {label}
                        </text>
                    );
                })}

                {!hasData && (
                    <text
                        x={W / 2} y={H / 2}
                        textAnchor="middle"
                        fill="rgba(100,116,139,0.5)"
                        fontSize="9"
                        fontFamily="monospace"
                    >
                        Awaiting intercept data...
                    </text>
                )}

                {hasData && METRICS.map(m => {
                    const pts = history.map((snap, i) => toPoint(i, total, snap[m.key] ?? 0));
                    const linePath = buildPath(pts);

                    // Closed area path
                    const firstPt = pts[0];
                    const lastPt = pts[pts.length - 1];
                    const areaPath = `${linePath} L ${lastPt.x},${H - PAD_B} L ${firstPt.x},${H - PAD_B} Z`;

                    const last = pts[pts.length - 1];

                    return (
                        <g key={m.key}>
                            {/* Area fill */}
                            <path
                                d={areaPath}
                                fill={`url(#grad-${m.key})`}
                                opacity={0.8}
                            />
                            {/* Line */}
                            <path
                                d={linePath}
                                fill="none"
                                stroke={m.color}
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter={`url(#glow-${m.key})`}
                            />
                            {/* Data dots */}
                            {pts.map((pt, i) => (
                                i < pts.length - 1 ? (
                                    <circle
                                        key={i}
                                        cx={pt.x} cy={pt.y} r={2}
                                        fill={m.color}
                                        opacity={0.5}
                                    />
                                ) : null
                            ))}
                            {/* Animated last-point pulse */}
                            <circle
                                ref={m.key === 'coercion_risk_node' ? animRef : undefined}
                                cx={last.x} cy={last.y} r={3.5}
                                fill={m.color}
                                filter={`url(#glow-${m.key})`}
                            >
                                <animate
                                    attributeName="r"
                                    values="2.5;4.5;2.5"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    values="1;0.5;1"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginTop: '0.4rem',
            }}>
                {METRICS.map(m => {
                    const last = history.length > 0 ? history[history.length - 1][m.key] : 0;
                    return (
                        <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                                width: '16px', height: '2px',
                                background: m.color,
                                borderRadius: '2px',
                                boxShadow: `0 0 6px ${m.glow}`,
                            }} />
                            <span style={{
                                fontSize: '0.6rem',
                                color: '#64748b',
                                fontFamily: 'var(--font-mono, monospace)',
                            }}>
                                {m.label}
                            </span>
                            {history.length > 0 && (
                                <span style={{
                                    fontSize: '0.6rem',
                                    color: m.color,
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontWeight: 700,
                                }}>
                                    {Math.round(last * 100)}%
                                </span>
                            )}
                        </div>
                    );
                })}
                {history.length >= 3 && (() => {
                    const first = history[0];
                    const last = history[history.length - 1];
                    const avgFirst = (first.coercion_risk_node + first.urgency_spike_node) / 2;
                    const avgLast = (last.coercion_risk_node + last.urgency_spike_node) / 2;
                    const isEscalating = avgLast > avgFirst + 0.05;
                    return isEscalating ? (
                        <span style={{
                            marginLeft: 'auto',
                            fontSize: '0.6rem',
                            color: '#ef4444',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 700,
                            animation: 'pulse 1.5s infinite',
                        }}>
                            ▲ ESCALATING
                        </span>
                    ) : null;
                })()}
            </div>
        </div>
    );
};
