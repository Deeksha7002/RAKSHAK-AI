import { useState } from 'react';
import { Play, Database, ScanEye, BarChart3, Zap, Link as LinkIcon, Shield, Target, ChevronRight, ChevronDown } from 'lucide-react';
import { soundManager } from '../../lib/SoundManager';

interface NavigationFooterProps {
    isMonitoring: boolean;
    activeView: string;
    selectedThreadId: string | null;
    onStartMonitoring: () => void;
    onToggleView: (view: 'DASHBOARD' | 'LOCKER' | 'FORENSICS' | 'INTELLIGENCE' | 'DEMO' | 'HONEY_TOKENS') => void;
    onToggleIntegration: () => void;
    onToggleProtocol: () => void;
}

export function NavigationFooter({
    isMonitoring,
    activeView,
    selectedThreadId,
    onStartMonitoring,
    onToggleView,
    onToggleIntegration,
    onToggleProtocol,
}: NavigationFooterProps) {
    const [openFolder, setOpenFolder] = useState<string | null>('tactical');

    const toggleFolder = (folder: string) => {
        setOpenFolder(prev => prev === folder ? null : folder);
        soundManager.playClick();
    };

    return (
        <div className="control-footer" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, borderTop: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', overflow: 'hidden' }}>
            {!isMonitoring ? (
                <div style={{ padding: '1rem' }}>
                    <button onClick={() => { onStartMonitoring(); soundManager.playClick(); }} className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                        <Play size={18} /> <span className="btn-text">INITIALIZE SYSTEM</span>
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    {/* SCROLLABLE AREA FOR FOLDERS */}
                    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '0.5rem' }}>
                        {/* TACTICAL MODULES FOLDER */}
                        <div className="nav-folder">
                            <button 
                                onClick={() => toggleFolder('tactical')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.6rem 1rem', background: openFolder === 'tactical' ? 'rgba(0,0,0,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                            >
                                <span>TACTICAL MODULES</span>
                                {openFolder === 'tactical' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            
                            {openFolder === 'tactical' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', padding: '0.5rem 0.6rem 0.6rem 0.6rem' }}>
                                    <button
                                        onClick={() => { onToggleView('INTELLIGENCE'); soundManager.playClick(); }}
                                        className={`btn btn-icon ${activeView === 'INTELLIGENCE' && !selectedThreadId ? 'active' : ''}`}
                                        title="Intelligence Graph"
                                    >
                                        <BarChart3 size={18} color={activeView === 'INTELLIGENCE' && !selectedThreadId ? "var(--primary)" : "#8b5cf6"} /> 
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('FORENSICS'); soundManager.playClick(); }}
                                        className={`btn btn-icon ${activeView === 'FORENSICS' && !selectedThreadId ? 'active' : ''}`}
                                        title="Forensics Lab"
                                    >
                                        <ScanEye size={18} color={activeView === 'FORENSICS' && !selectedThreadId ? "var(--primary)" : "#3b82f6"} /> 
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('HONEY_TOKENS'); soundManager.playClick(); }}
                                        className={`btn btn-icon ${activeView === 'HONEY_TOKENS' && !selectedThreadId ? 'active' : ''}`}
                                        title="Honey Tokens"
                                    >
                                        <Target size={18} color={activeView === 'HONEY_TOKENS' && !selectedThreadId ? "var(--primary)" : "#ef4444"} /> 
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('DEMO'); soundManager.playClick(); }}
                                        className={`btn btn-icon ${activeView === 'DEMO' && !selectedThreadId ? 'active' : ''}`}
                                        title="Threat Lab (Demo)"
                                    >
                                        <Zap size={18} color={activeView === 'DEMO' && !selectedThreadId ? "var(--primary)" : "#fbbf24"} /> 
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('LOCKER'); soundManager.playClick(); }}
                                        className={`btn btn-icon ${activeView === 'LOCKER' && !selectedThreadId ? 'active' : ''}`}
                                        title="Evidence Vault"
                                    >
                                        <Database size={18} color={activeView === 'LOCKER' && !selectedThreadId ? "var(--primary)" : "#ec4899"} /> 
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SYSTEM POLICIES FOLDER */}
                        <div className="nav-folder">
                            <button 
                                onClick={() => toggleFolder('system')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.6rem 1rem', background: openFolder === 'system' ? 'rgba(0,0,0,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                            >
                                <span>SYSTEM & POLICIES</span>
                                {openFolder === 'system' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            
                            {openFolder === 'system' && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', padding: '0.5rem 0.6rem 0.6rem 0.6rem' }}>
                                    <button
                                        onClick={() => { onToggleProtocol(); soundManager.playClick(); }}
                                        className="btn btn-icon"
                                        title="Security Protocols"
                                    >
                                        <Shield size={18} color="#10b981" />
                                    </button>
                                    <button
                                        onClick={() => { onToggleIntegration(); soundManager.playClick(); }}
                                        className="btn btn-icon"
                                        title="API Integrations"
                                    >
                                        <LinkIcon size={18} color="#a1a1aa" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
