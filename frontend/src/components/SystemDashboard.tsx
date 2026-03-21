import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Shield, Wifi, Server, Zap, Globe, Lock, AlertTriangle } from 'lucide-react';
import { GlobalThreatMap } from './GlobalThreatMap';
import { type GeoLocation } from '../lib/types';
import { API_BASE_URL } from '../lib/config';
import { PersistenceService } from '../lib/PersistenceService';

interface SystemDashboardProps {
    activeThreats?: number;
    locations?: GeoLocation[];
    onSimulateAttack?: () => void;
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({ activeThreats = 0, locations = [], onSimulateAttack }) => {
    const [targetCpu, setTargetCpu] = useState(12);
    const [targetNetwork, setTargetNetwork] = useState(45);
    const [displayCpu, setDisplayCpu] = useState(12);
    const [displayNetwork, setDisplayNetwork] = useState(45);
    const [neuralPoints, setNeuralPoints] = useState<number[]>(Array(30).fill(20));
    const [enhancedMonitoring, setEnhancedMonitoring] = useState<{ region: string, active: boolean }>({ region: '', active: false });
    const [isLoading, setIsLoading] = useState(true);

    // 1. Initial State Reconciliation (Cloud Sync)
    useEffect(() => {
        const initCloudState = async () => {
            setIsLoading(true);
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
            setIsLoading(false);
        };

        initCloudState();
        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Slower polling now that we have sync
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

                // Predictive Load Balancing Math
                // Introduce dynamic network variance based on live active threats
                const variance = activeReports > 0 ? (Math.random() * 30 - 15) : (Math.random() * 5 - 2.5);
                setTargetNetwork(Math.max(10, Math.min(999, (activeReports * 3.5) + 45 + variance)));

                // CPU load scales non-linearly with reports (simulating deep exponential NLP processing costs)
                const cpuCost = Math.min(100, 12 + Math.pow(activeReports, 1.2) * 2.5);
                setTargetCpu(cpuCost);
            }
        } catch (e) {
            console.error("Dashboard sync failed", e);
        }
    };

    // 2. Highly Advanced Physics Easing (Spring Dynamics) for buttery smooth tickers
    useEffect(() => {
        let animationFrame: number;

        const updatePhysics = () => {
            setDisplayCpu(prev => {
                const diff = targetCpu - prev;
                return prev + (diff * 0.05); // Smooth easing factor
            });

            setDisplayNetwork(prev => {
                const diff = targetNetwork - prev;
                return prev + (diff * 0.08); // Network shifts slightly faster
            });

            // Evolve Live Neural Spline Array for the background graph
            setNeuralPoints(prev => {
                const newPoints = [...prev.slice(1)];
                // Base noise off the target CPU stress level
                const noise = (Math.random() * 15 - 7.5) * (targetCpu / 100 + 0.5);
                const nextVal = 20 + noise; // Base spline height is 20
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

            // Calculate tilt percentages (-12 to 12 degrees for realism)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = (y - centerY) / centerY * -12;
            const tiltY = (x - centerX) / centerX * 12;

            setTilt({ x: tiltX, y: tiltY });

            // Set dynamic lighting (0-100%)
            setShine({
                x: (x / rect.width) * 100,
                y: (y / rect.height) * 100
            });
        };

        const handleMouseLeave = () => {
            setTilt({ x: 0, y: 0 });
            setIsHovered(false);
        };

        // Render Live Neural Graph Background (Only for the CPU/Network cards)
        const renderGraph = () => {
            if (!metric) return null; // Only render graph on active metrics
            const pointsStr = neuralPoints.map((p, i) => `${(i / (neuralPoints.length - 1)) * 100},${50 - p}`).join(' L ');
            return (
                <svg className="neural-graph-svg" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50px', opacity: 0.15, zIndex: 0, pointerEvents: 'none' }} preserveAspectRatio="none">
                    <path d={`M 0,50 L ${pointsStr} L 100,50 Z`} fill={color} />
                    <path d={`M 0,50 L ${pointsStr}`} stroke={color} strokeWidth="2" fill="none" />
                </svg>
            );
        };

        if (isLoading) {
            return (
                <div className="sys-card sys-card-skeleton">
                    <div className="skeleton-header" style={{ width: '40%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                    <div className="skeleton-value" style={{ width: '70%', height: '32px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0', borderRadius: '4px' }} />
                    <div className="skeleton-sub" style={{ width: '50%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                </div>
            );
        }

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
                {/* Hyper-Realistic Overlays */}
                <div className="material-grain" />
                <div className="hologram-overlay" />
                <div className="glare-surface" />
                <div className="sys-card-accent-tl" />

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
        <div className="dashboard-grid">
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '8px', 
                        background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
                        padding: '4px', overflow: 'hidden'
                    }}>
                        <img src="/favicon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Globe size={24} className={`spin-slow ${activeThreats > 20 ? 'text-red' : ''}`} style={{ color: activeThreats > 20 ? 'var(--status-danger)' : 'var(--primary)' }} />
                        <h2 style={{ color: activeThreats > 20 ? 'var(--status-danger)' : 'inherit' }}>
                            {activeThreats > 20 ? '⚠️ CRITICAL THREAT LEVEL: BOTNET DETECTED' : 'GLOBAL THREAT SURVEILLANCE'}
                        </h2>
                    </div>
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
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            ⚡ SIMULATE ATTACK
                        </button>
                    )}
                    <div className={`live-badge ${activeThreats > 20 ? 'animate-pulse' : ''}`} style={activeThreats > 20 ? { background: 'var(--status-danger)', color: 'white' } : {}}>
                        {activeThreats > 20 ? 'UNDER ATTACK' : 'LIVE FEED'}
                    </div>
                </div>
            </div>

            <div className="vitals-row">
                <StatusCard
                    icon={<Cpu size={18} />}
                    label="NEURAL ENGINE"
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
            <div className="map-section">
                <GlobalThreatMap onRegionSelect={handleRegionSelect} activeLocations={locations} />

                {enhancedMonitoring.active && (
                    <div className="enhanced-monitoring-overlay" style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(15, 23, 42, 0.8)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1001 // Higher than map controls
                    }}>
                        <AlertTriangle size={48} className="text-red animate-pulse" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>ENHANCED MONITORING ACTIVE</h3>
                        <div className="monitoring-detail" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                            TARGET: <span className="text-red">{enhancedMonitoring.region.toUpperCase()}</span>
                            {locations
                                .filter(loc => {
                                    // Basic include check mapping (could be improved to match map logic but this is decent for UI)
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
                                background: 'rgba(0,0,0,0.4)'
                            }}
                        >
                            DISABLE MONITORING
                        </button>
                    </div>
                )}
            </div>

            <div className="services-list">
                <div className="service-item">
                    <Server size={14} /> <span>Rakshak Protocols: <span className="text-green">READY</span></span>
                </div>
                <div className="service-item">
                    <Lock size={14} /> <span>Encryption: <span className="text-green">VERIFIED</span></span>
                </div>
                <div className="service-item">
                    <Zap size={14} /> <span>AI Response: <span className="text-blue">12ms</span></span>
                </div>
                {enhancedMonitoring.active && (
                    <div className="service-item" style={{ color: 'var(--status-danger)' }}>
                        <Activity size={14} /> <span>Zone Alert: {enhancedMonitoring.region}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
