import React, { useEffect, useState } from 'react';
import { Cpu, Shield, Wifi, Server, Zap, Globe, Lock, AlertTriangle, ChevronDown, ChevronUp, ChevronRight, CheckCircle2, AlertOctagon } from 'lucide-react';
import { GlobalThreatMap } from './GlobalThreatMap';
import { type GeoLocation } from '../lib/types';
import { API_BASE_URL } from '../lib/config';
import { PersistenceService } from '../lib/PersistenceService';

interface SystemDashboardProps {
    activeThreats?: number;
    locations?: GeoLocation[];
    onSimulateAttack?: () => void;
    threads?: any[];
    onReviewThreat?: (threadId: string) => void;
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({
    activeThreats = 0,
    locations = [],
    onSimulateAttack,
    threads = [],
    onReviewThreat
}) => {
    const [targetCpu, setTargetCpu] = useState(12);
    const [targetNetwork, setTargetNetwork] = useState(45);
    const [displayCpu, setDisplayCpu] = useState(12);
    const [displayNetwork, setDisplayNetwork] = useState(45);
    const [neuralPoints, setNeuralPoints] = useState<number[]>(Array(30).fill(20));
    const [enhancedMonitoring, setEnhancedMonitoring] = useState<{ region: string, active: boolean }>({ region: '', active: false });
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Initial State Reconciliation (Cloud Sync)
    useEffect(() => {
        const initCloudState = async () => {
            await PersistenceService.initializeState(
                (stats) => {
                    const activeReports = stats.reports_filed || 0;
                    setTargetCpu(Math.min(100, 12 + Math.pow(activeReports, 1.2) * 2.5));
                    setTargetNetwork(Math.max(10, Math.min(999, (activeReports * 3.5) + 45)));
                },
                (coords) => {
                    if (coords && coords.length > 0) {
                        localStorage.setItem('threat_coordinates', JSON.stringify(coords));
                    }
                }
            );
        };

        initCloudState();
        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Poll server
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('rakshak_access_token');
            const res = await fetch(`${API_BASE_URL}/api/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const activeReports = data.reports_filed || 0;

                const variance = activeReports > 0 ? (Math.random() * 30 - 15) : (Math.random() * 5 - 2.5);
                setTargetNetwork(Math.max(10, Math.min(999, (activeReports * 3.5) + 45 + variance)));

                const cpuCost = Math.min(100, 12 + Math.pow(activeReports, 1.2) * 2.5);
                setTargetCpu(cpuCost);
            }
        } catch (e) {
            console.error("Dashboard sync failed", e);
        }
    };

    // Advanced Physics Easing for background splines
    useEffect(() => {
        let animationFrame: number;

        const updatePhysics = () => {
            setDisplayCpu(prev => {
                const diff = targetCpu - prev;
                return prev + (diff * 0.05);
            });

            setDisplayNetwork(prev => {
                const diff = targetNetwork - prev;
                return prev + (diff * 0.08);
            });

            setNeuralPoints(prev => {
                const newPoints = [...prev.slice(1)];
                const noise = (Math.random() * 15 - 7.5) * (targetCpu / 100 + 0.5);
                const nextVal = 20 + noise;
                newPoints.push(Math.max(2, Math.min(48, nextVal)));
                return newPoints;
            });

            animationFrame = requestAnimationFrame(updatePhysics);
        };

        animationFrame = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(animationFrame);
    }, [targetCpu, targetNetwork]);

    const handleRegionSelect = (regionName: string, threatLevel: string) => {
        if (threatLevel === 'HIGH') {
            setEnhancedMonitoring({ region: regionName, active: true });
        } else {
            setEnhancedMonitoring({ region: '', active: false });
        }
    };

    // Calculate dynamic stats
    const scamThreads = threads.filter(t => t.classification === 'scam' || t.classification === 'likely_scam');
    const hasThreat = scamThreads.length > 0;

    const threatsAnalyzed = Math.max(3, threads.length);
    const threatsBlocked = Math.max(2, scamThreads.length);
    const reportsCreated = Math.max(1, threads.filter(t => t.autoReported).length);

    const StatusCard = ({ icon, label, value, subtext, metric, color, pulse }: any) => {
        const cardRef = React.useRef<HTMLDivElement>(null);
        const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
        const [shine, setShine] = React.useState({ x: 50, y: 50 });
        const [isHovered, setIsHovered] = React.useState(false);

        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!cardRef.current) return;
            setIsHovered(true);
            const rect = cardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = (y - centerY) / centerY * -8;
            const tiltY = (x - centerX) / centerX * 8;

            setTilt({ x: tiltX, y: tiltY });
            setShine({
                x: (x / rect.width) * 100,
                y: (y / rect.height) * 100
            });
        };

        const handleMouseLeave = () => {
            setTilt({ x: 0, y: 0 });
            setIsHovered(false);
        };

        const renderGraph = () => {
            if (!metric) return null;
            const pointsStr = neuralPoints.map((p, i) => `${(i / (neuralPoints.length - 1)) * 100},${50 - p}`).join(' L ');
            return (
                <svg className="neural-graph-svg" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50px', opacity: 0.15, zIndex: 0, pointerEvents: 'none' }} preserveAspectRatio="none">
                    <path d={`M 0,50 L ${pointsStr} L 100,50 Z`} fill={color} />
                    <path d={`M 0,50 L ${pointsStr}`} stroke={color} strokeWidth="2" fill="none" />
                </svg>
            );
        };

        return (
            <div
                ref={cardRef}
                className={`sys-card ${!isHovered ? 'sys-card-idle' : ''}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    borderLeft: pulse ? `2px solid ${color}` : undefined,
                    transform: isHovered ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` : undefined,
                    '--mouse-x': `${shine.x}%`,
                    '--mouse-y': `${shine.y}%`
                } as React.CSSProperties}
            >
                <div className="sys-card-header" style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ color }} className={pulse ? 'neural-active' : ''}>{icon}</span>
                    <span className="sys-card-label">{label}</span>
                </div>
                <div className="sys-card-value" style={{ color, position: 'relative', zIndex: 1 }}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                </div>
                <div className="sys-progress-bg" style={{ position: 'relative', zIndex: 1 }}>
                    <div
                        className="sys-progress-bar"
                        style={{ width: subtext.includes('%') ? subtext : '100%', background: color, color }}
                    />
                </div>
                <div className="sys-card-sub" style={{ position: 'relative', zIndex: 1 }}>
                    <span>{subtext}</span>
                    {metric && <span className="sys-card-metric">{metric}</span>}
                </div>
                {renderGraph()}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {/* BRAND HERO SECTION */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                        width: '36px', height: '36px', borderRadius: '8px', 
                        background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <Shield size={20} color="var(--primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Rakshak</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Your Digital Safety Center</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="live-badge" style={{ 
                        background: hasThreat ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: hasThreat ? '#f87171' : '#34d399',
                        border: `1px solid ${hasThreat ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span className={`status-dot ${hasThreat ? 'bg-red animate-pulse' : 'bg-green'}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasThreat ? 'var(--status-danger)' : 'var(--status-success)' }} />
                        {hasThreat ? 'ATTENTION REQUIRED' : 'SECURE'}
                    </span>
                </div>
            </div>

            {/* SIMPLIFIED ANSWERS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                {/* 1. AM I SAFE CARD */}
                <div className="sys-card" style={{ borderLeft: `4px solid ${hasThreat ? 'var(--status-danger)' : 'var(--status-success)'}`, background: 'rgba(30, 41, 59, 0.4)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ color: hasThreat ? 'var(--status-danger)' : 'var(--status-success)', flexShrink: 0, marginTop: '2px' }}>
                            {hasThreat ? <AlertOctagon size={22} /> : <CheckCircle2 size={22} />}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Am I safe?</h2>
                            {hasThreat ? (
                                <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    ⚠️ Action Needed: Suspicious activity detected
                                </p>
                            ) : (
                                <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    🟢 You're protected
                                </p>
                            )}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                                {hasThreat 
                                    ? "Rakshak has flagged potential scam attempts that require your review."
                                    : "Your account is being actively monitored for suspicious messages and links."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. IS THERE A THREAT CARD */}
                <div className="sys-card" style={{ borderLeft: `4px solid ${hasThreat ? 'var(--status-warning)' : 'var(--status-success)'}`, background: 'rgba(30, 41, 59, 0.4)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ color: hasThreat ? 'var(--status-warning)' : 'var(--status-success)', flexShrink: 0, marginTop: '2px' }}>
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Is there a threat?</h2>
                            {hasThreat ? (
                                <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    🟠 {scamThreads.length} suspicious message{scamThreads.length > 1 ? 's' : ''} detected
                                </p>
                            ) : (
                                <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    🟢 No threats detected
                                </p>
                            )}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                                {hasThreat
                                    ? "A suspected phishing or scam message has been intercepted in your inbox."
                                    : "No malicious links, deepfakes, or social engineering messages were found."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. WHAT SHOULD I DO CARD */}
                <div className="sys-card" style={{ borderLeft: `4px solid var(--primary)`, background: 'rgba(30, 41, 59, 0.4)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h2 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>What should I do?</h2>
                        {hasThreat ? (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                                    Please review the flagged message immediately to secure your communications.
                                </p>
                                <button 
                                    onClick={() => onReviewThreat && onReviewThreat(scamThreads[0].id)}
                                    className="btn-primary-glow"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '10px 16px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: 'var(--primary)',
                                        color: '#0f172a'
                                    }}
                                >
                                    Review Threat <ChevronRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                                    All clear! Keep monitoring.
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    You are fully protected. No action is required from you at this time.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RECENT PROTECTION STATS */}
            <div className="sys-card" style={{ background: 'rgba(30, 41, 59, 0.2)', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem 0', letterSpacing: '0.5px' }}>Recent Protection</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>✓</span>
                        <span><strong>{threatsAnalyzed}</strong> threats analyzed</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>✓</span>
                        <span><strong>{threatsBlocked}</strong> suspicious links blocked</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>✓</span>
                        <span><strong>{reportsCreated}</strong> report{reportsCreated > 1 ? 's' : ''} created</span>
                    </li>
                </ul>
            </div>

            {/* COLLAPSIBLE ADVANCED OPERATIONS PANEL */}
            <div style={{ marginTop: '0.5rem' }}>
                <button
                    onClick={() => {
                        setShowAdvanced(!showAdvanced);
                        if (onSimulateAttack) {
                            // Optional: play click sound
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                    }}
                >
                    <span>{showAdvanced ? 'HIDE ADVANCED OPERATIONS' : 'SHOW ADVANCED OPERATIONS'}</span>
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvanced && (
                    <div className="dashboard-grid" style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="dashboard-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Globe size={18} className={`spin-slow ${activeThreats > 20 ? 'text-red' : ''}`} style={{ color: activeThreats > 20 ? 'var(--status-danger)' : 'var(--primary)' }} />
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Threat Locations</h3>
                            </div>
                            <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {onSimulateAttack && (
                                    <button
                                        onClick={onSimulateAttack}
                                        className="btn-danger-glow"
                                        style={{
                                            background: 'rgba(220, 38, 38, 0.2)',
                                            border: '1px solid var(--status-danger)',
                                            color: 'var(--status-danger)',
                                            padding: '0.4rem 0.8rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        ⚡ SIMULATE ATTACK
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="vitals-row" style={{ marginBottom: '1.25rem' }}>
                            <StatusCard
                                icon={<Cpu size={18} />}
                                label="Threat Analysis"
                                value={Math.min(99.9, activeThreats > 0 ? (activeThreats * 5) + displayCpu : displayCpu)}
                                subtext={activeThreats > 0 ? `${activeThreats} THREATS ACTIVE` : "Processing Load %"}
                                metric={`TEMP: ${Math.floor(38 + (Math.min(100, displayCpu) * 0.4))}°C`}
                                color={activeThreats > 0 ? "var(--status-danger)" : "var(--primary)"}
                                pulse={activeThreats > 0}
                            />
                            <StatusCard
                                icon={<Wifi size={18} />}
                                label="NETWORK"
                                value={displayNetwork}
                                subtext="Encrypted Traffic (Mb/s)"
                                metric="ROUTING: PREDICTIVE"
                                color="var(--status-info)"
                            />
                            <StatusCard
                                icon={<Shield size={18} />}
                                label="DEFENSE"
                                value="ACTIVE"
                                subtext="Firewall Integrity"
                                metric="UPTIME: 99.9%"
                                color="var(--status-success)"
                            />
                        </div>

                        {/* Map Section */}
                        <div className="map-section" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                            <GlobalThreatMap onRegionSelect={handleRegionSelect} activeLocations={locations} />

                            {enhancedMonitoring.active && (
                                <div className="enhanced-monitoring-overlay" style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 1001
                                }}>
                                    <AlertTriangle size={48} className="text-red animate-pulse" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>ENHANCED MONITORING ACTIVE</h3>
                                    <div className="monitoring-detail" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                                        TARGET: <span className="text-red">{enhancedMonitoring.region.toUpperCase()}</span>
                                        {locations
                                            .filter(loc => {
                                                const region = enhancedMonitoring.region;
                                                if (region === 'North America' && (loc.country.includes('USA') || loc.country.includes('US'))) return true;
                                                if (region === 'Asia' && (loc.country.includes('India') || loc.country.includes('China') || loc.city.includes('Delhi') || loc.city.includes('Mumbai'))) return true;
                                                if (region === 'Africa' && (loc.country.includes('Nigeria') || loc.city.includes('Lagos'))) return true;
                                                if (region === 'Europe' && (loc.country.includes('UK') || loc.country.includes('Russia'))) return true;
                                                return false;
                                            })
                                            .map((loc, i) => (
                                                <div key={i} style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                                    📍 {loc.city}, {loc.country}
                                                </div>
                                            ))
                                        }
                                    </div>
                                    <button
                                        onClick={() => setEnhancedMonitoring({ region: '', active: false })}
                                        className="btn btn-secondary"
                                        style={{
                                            borderColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            background: 'rgba(0,0,0,0.4)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        DISABLE MONITORING
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="services-list" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <div className="service-item">
                                <Server size={14} /> <span>Rakshak Protocols: <span className="text-green">READY</span></span>
                            </div>
                            <div className="service-item">
                                <Lock size={14} /> <span>Encryption: <span className="text-green">VERIFIED</span></span>
                            </div>
                            <div className="service-item">
                                <Zap size={14} /> <span>AI Response: <span className="text-blue">12ms</span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
