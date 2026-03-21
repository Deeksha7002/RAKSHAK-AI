import { useState } from 'react';
import { Play, Database, ScanEye, BarChart3, Zap, Volume2, VolumeX, Link as LinkIcon, LogOut, Shield, Target, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { soundManager } from '../../lib/SoundManager';

interface NavigationFooterProps {
    isMonitoring: boolean;
    activeView: string;
    selectedThreadId: string | null;
    isMuted: boolean;
    onStartMonitoring: () => void;
    onToggleView: (view: 'DASHBOARD' | 'LOCKER' | 'FORENSICS' | 'INTELLIGENCE' | 'DEMO' | 'HONEY_TOKENS') => void;
    onToggleMute: () => void;
    onToggleIntegration: () => void;
    onToggleProtocol: () => void;
    onOpenTour: () => void;
    onLogout: () => void;
}

export function NavigationFooter({
    isMonitoring,
    activeView,
    selectedThreadId,
    isMuted,
    onStartMonitoring,
    onToggleView,
    onToggleMute,
    onToggleIntegration,
    onToggleProtocol,
    onOpenTour,
    onLogout
}: NavigationFooterProps) {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
        tactical: true,
        system: false,
    });

    const toggleFolder = (folder: string) => {
        setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
        soundManager.playClick();
    };

    return (
        <div className="control-footer" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, borderTop: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', overflow: 'hidden' }}>
            {!isMonitoring ? (
                <div style={{ padding: '1.5rem 1rem' }}>
                    <button onClick={() => { onStartMonitoring(); soundManager.playClick(); }} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                        <Play size={20} /> <span className="btn-text">INITIALIZE SYSTEM</span>
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    {/* SCROLLABLE AREA FOR FOLDERS */}
                    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
                        {/* TACTICAL MODULES FOLDER */}
                        <div className="nav-folder">
                            <button 
                                onClick={() => toggleFolder('tactical')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1rem 1.25rem', background: openFolders.tactical ? 'rgba(0,0,0,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                            >
                                <span>TACTICAL MODULES</span>
                                {openFolders.tactical ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            
                            {openFolders.tactical && (
                                <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 1rem 0.25rem 1rem', gap: '4px' }}>
                                    <button
                                        onClick={() => { onToggleView('INTELLIGENCE'); soundManager.playClick(); }}
                                        style={navItemStyle(activeView === 'INTELLIGENCE' && !selectedThreadId)}
                                    >
                                        <BarChart3 size={18} color={activeView === 'INTELLIGENCE' && !selectedThreadId ? "var(--primary)" : "#8b5cf6"} /> 
                                        <span>Intelligence Graph</span>
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('FORENSICS'); soundManager.playClick(); }}
                                        style={navItemStyle(activeView === 'FORENSICS' && !selectedThreadId)}
                                    >
                                        <ScanEye size={18} color={activeView === 'FORENSICS' && !selectedThreadId ? "var(--primary)" : "#3b82f6"} /> 
                                        <span>Forensics Lab</span>
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('HONEY_TOKENS'); soundManager.playClick(); }}
                                        style={navItemStyle(activeView === 'HONEY_TOKENS' && !selectedThreadId)}
                                    >
                                        <Target size={18} color={activeView === 'HONEY_TOKENS' && !selectedThreadId ? "var(--primary)" : "#ef4444"} /> 
                                        <span>Honey Tokens</span>
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('DEMO'); soundManager.playClick(); }}
                                        style={navItemStyle(activeView === 'DEMO' && !selectedThreadId)}
                                    >
                                        <Zap size={18} color={activeView === 'DEMO' && !selectedThreadId ? "var(--primary)" : "#fbbf24"} /> 
                                        <span>Threat Lab (Demo)</span>
                                    </button>
                                    <button
                                        onClick={() => { onToggleView('LOCKER'); soundManager.playClick(); }}
                                        style={navItemStyle(activeView === 'LOCKER' && !selectedThreadId)}
                                    >
                                        <Database size={18} color={activeView === 'LOCKER' && !selectedThreadId ? "var(--primary)" : "#ec4899"} /> 
                                        <span>Evidence Vault</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* SYSTEM POLICIES FOLDER */}
                        <div className="nav-folder">
                            <button 
                                onClick={() => toggleFolder('system')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1rem 1.25rem', background: openFolders.system ? 'rgba(0,0,0,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                            >
                                <span>SYSTEM & POLICIES</span>
                                {openFolders.system ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            
                            {openFolders.system && (
                                <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 1rem 0.25rem 1rem', gap: '4px' }}>
                                    <button
                                        onClick={() => { onToggleProtocol(); soundManager.playClick(); }}
                                        style={navItemStyle(false)}
                                    >
                                        <Shield size={18} color="#10b981" /> <span>Security Protocols</span>
                                    </button>
                                    <button
                                        onClick={() => { onToggleIntegration(); soundManager.playClick(); }}
                                        style={navItemStyle(false)}
                                    >
                                        <LinkIcon size={18} color="#a1a1aa" /> <span>API Integrations</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACCOUNT & PREFERENCES STRIP (Sticky to bottom of sidebar) */}
                    <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                        <button
                            onClick={() => { onOpenTour(); soundManager.playClick(); }}
                            title="App Tutorial"
                            className="btn-icon"
                            style={{ flex: 1, height: '42px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}
                        >
                            <HelpCircle size={18} color="#fbbf24" />
                        </button>
                        <button
                            onClick={() => { onToggleMute(); soundManager.playClick(); }}
                            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                            className="btn-icon"
                            style={{ flex: 1, height: '42px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}
                        >
                            {isMuted ? <VolumeX size={18} color="#94a3b8" /> : <Volume2 size={18} color="#94a3b8" />}
                        </button>
                        <button
                            onClick={() => { onLogout(); soundManager.playClick(); }}
                            title="Terminate Session"
                            className="btn-icon"
                            style={{ flex: 1, height: '42px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
                        >
                            <LogOut size={18} color="#ef4444" />
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}

// Helper for inline active state styling of list items
const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    width: '100%', 
    padding: '10px 14px', 
    background: isActive ? 'var(--primary-subtle)' : 'transparent', 
    border: `1px solid ${isActive ? 'var(--primary)' : 'transparent'}`, 
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s ease'
});
