import { useState } from 'react';
import { Database, ScanEye, BarChart3, Zap, Link as LinkIcon, Shield, Target, ChevronRight, ChevronDown, Eye, Settings, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../lib/SoundManager';

interface NavigationFooterProps {
    activeView: string;
    selectedThreadId: string | null;
    onToggleView: (view: 'DASHBOARD' | 'LOCKER' | 'FORENSICS' | 'INTELLIGENCE' | 'DEMO' | 'HONEY_TOKENS') => void;
    onToggleIntegration: () => void;
    onToggleProtocol: () => void;
    onNuke: () => void;
}

export function NavigationFooter({
    activeView,
    selectedThreadId,
    onToggleView,
    onToggleIntegration,
    onToggleProtocol,
    onNuke,
}: NavigationFooterProps) {
    const { nukeAccount, nukeAccountWithPassword } = useAuth();
    const [openFolder, setOpenFolder] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');

    const toggleFolder = (folder: string) => {
        setOpenFolder(prev => prev === folder ? null : folder);
        soundManager.playClick();
    };

    const handleNuke = async () => {
        const msg1 = "NUCLEAR DISPOSAL PROTOCOL\n\n" +
                     "CRITICAL WARNING: You are about to PERMANENTLY DELETE your account and all associated forensic data.\n\n" +
                     "This action will:\n" +
                     "1. Wipe your account from the Rakshak Core server.\n" +
                     "2. Revoke all active security tokens.\n" +
                     "3. Scrub all local telemetry and case files.\n\n" +
                     "THIS IS IRREVERSIBLE. Are you sure?";
                     
        if (window.confirm(msg1)) {
            const typedConfirm = window.prompt(
                "INTENT VERIFICATION\n\n" +
                "To confirm your absolute intent to destroy all records, please type exactly:\n\n" +
                "AUTHORIZE DELETE"
            );

            if (typedConfirm?.trim().toUpperCase() === "AUTHORIZE DELETE") {
                try {
                    console.log("[NUCLEAR] Primary protocol: Requesting biometric assertion...");
                    const success = await nukeAccount();
                    if (success) {
                        alert("SECURE WIPE COMPLETE: All volatile data clusters and account records have been incinerated.");
                        onNuke();
                    }
                } catch (e: any) {
                    // Check if biometric is unavailable, cancelled, or not enrolled
                    const isBioIssue = !e.message || 
                        e.message.toLowerCase().includes('no biometric') ||
                        e.message.toLowerCase().includes('not allowed') ||
                        e.message.toLowerCase().includes('credential') ||
                        e.message.toLowerCase().includes('cancelled') ||
                        e.message.toLowerCase().includes('no active') ||
                        e.message.toLowerCase().includes('failed to start') ||
                        e.message.toLowerCase().includes('enrolled') ||
                        e.message.toLowerCase().includes('biometric nuke');

                    if (isBioIssue) {
                        // ── FALLBACK SEQUENCE: Verify Account Password ──
                        const passwordFallback = window.prompt(
                            "BIOMETRIC UNAVAILABLE / CANCELLED\n\n" +
                            "To authorize account destruction, please enter your OPERATOR PASSWORD:"
                        );
                        
                        if (passwordFallback) {
                            try {
                                setStatus('AUTHORIZING FULL PURGE...');
                                const nukeSuccess = await nukeAccountWithPassword(passwordFallback);
                                if (nukeSuccess) {
                                    alert("SECURE WIPE COMPLETE: Proxy verification successful. All records have been incinerated.");
                                    onNuke();
                                }
                            } catch (error: any) {
                                alert("DESTRUCTION ABORTED: " + (error.message || "Password verification failed."));
                                setStatus('DESTRUCTION ABORTED');
                                setTimeout(() => setStatus(''), 3000);
                            }
                        } else {
                            // User cancelled the password prompt as well
                            setStatus('DESTRUCTION ABORTED BY OPERATOR');
                            setTimeout(() => setStatus(''), 3000);
                        }
                    } else {
                        // Something else went wrong (network error etc)
                        alert("CRITICAL ERROR: " + (e.message || "Disposal protocol failed to initialize."));
                        setStatus('SYSTEM ERROR');
                        setTimeout(() => setStatus(''), 3000);
                    }
                }
            } else if (typedConfirm !== null) {
                alert("INVALID AUTHORIZATION PHRASE. Protocol aborted.");
            }
        }
    };

    return (
        <div className="control-footer" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, borderTop: '1px solid var(--border-color)', background: 'var(--bg-sidebar)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* SCROLLABLE AREA FOR FOLDERS */}
                <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '0.5rem' }}>
                    {status && (
                        <div style={{ 
                            padding: '8px 12px', 
                            margin: '8px',
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            color: '#f87171',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <ShieldAlert size={14} />
                            {status}
                        </div>
                    )}
                    {/* TACTICAL MODULES FOLDER */}
                    <div className="nav-folder">
                        <button 
                            onClick={() => toggleFolder('tactical')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.6rem 1rem', background: openFolder === 'tactical' ? 'rgba(0,0,0,0.1)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={16} color="var(--primary)" />
                                <span>TACTICAL MODULES</span>
                            </div>
                            {openFolder === 'tactical' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        
                        {openFolder === 'tactical' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', padding: '0.8rem' }}>
                                {/* INTELLIGENCE */}
                                <button
                                    onClick={() => { onToggleView('INTELLIGENCE'); soundManager.playClick(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: activeView === 'INTELLIGENCE' && !selectedThreadId ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: activeView === 'INTELLIGENCE' && !selectedThreadId ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex' }}><BarChart3 size={18} color="#a78bfa" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>INTELLIGENCE GRAPH</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Threat vector analytics</div>
                                    </div>
                                </button>

                                {/* FORENSICS */}
                                <button
                                    onClick={() => { onToggleView('FORENSICS'); soundManager.playClick(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: activeView === 'FORENSICS' && !selectedThreadId ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: activeView === 'FORENSICS' && !selectedThreadId ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex' }}><ScanEye size={18} color="#60a5fa" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>FORENSICS LAB</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Inspect scam evidence</div>
                                    </div>
                                </button>

                                {/* HONEY TOKENS */}
                                <button
                                    onClick={() => { onToggleView('HONEY_TOKENS'); soundManager.playClick(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: activeView === 'HONEY_TOKENS' && !selectedThreadId ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: activeView === 'HONEY_TOKENS' && !selectedThreadId ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex' }}><Target size={18} color="#f87171" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>HONEY TOKENS</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Manage active traps</div>
                                    </div>
                                </button>

                                {/* THREAT LAB */}
                                <button
                                    onClick={() => { onToggleView('DEMO'); soundManager.playClick(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: activeView === 'DEMO' && !selectedThreadId ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: activeView === 'DEMO' && !selectedThreadId ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex' }}><Zap size={18} color="#fbbf24" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>THREAT LAB</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Simulate attacks</div>
                                    </div>
                                </button>

                                {/* EVIDENCE VAULT */}
                                <button
                                    onClick={() => { onToggleView('LOCKER'); soundManager.playClick(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: activeView === 'LOCKER' && !selectedThreadId ? 'rgba(236, 72, 153, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: activeView === 'LOCKER' && !selectedThreadId ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex' }}><Database size={18} color="#f472b6" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>EVIDENCE VAULT</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Manage case files</div>
                                    </div>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={16} color="#94a3b8" />
                                <span>SYSTEM & POLICIES</span>
                            </div>
                            {openFolder === 'system' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        
                        {openFolder === 'system' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', padding: '0.8rem' }}>
                                {/* SECURITY PROTOCOLS */}
                                <button
                                    onClick={() => { onToggleProtocol(); soundManager.playClick(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex' }}><Shield size={18} color="#34d399" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>SECURITY PROTOCOLS</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Review defense rules</div>
                                    </div>
                                </button>

                                {/* API INTEGRATION */}
                                <button
                                    onClick={() => { onToggleIntegration(); soundManager.playClick(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                                    }}
                                >
                                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(161, 161, 170, 0.1)', display: 'flex' }}><LinkIcon size={18} color="#d4d4d8" /></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <div style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700 }}>API INTEGRATIONS</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Uplink node status</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* EMERGENCY PANEL */}
                    <div style={{ padding: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem' }}>
                        <button
                            onClick={handleNuke}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(127, 29, 29, 0.02) 100%)',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', width: '100%',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(239, 68, 68, 0.05)',
                                position: 'relative', overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.2)', filter: 'blur(20px)', borderRadius: '50%' }} />
                            
                            <div style={{ padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))', display: 'flex', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)' }}>
                                <ShieldAlert size={18} color="#ef4444" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1 }}>
                                <div style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>EMERGENCY DATA DISPOSAL</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>Wipe all volatile data instantly</div>
                            </div>
                            <div style={{ color: '#ef4444', opacity: 0.3 }}>
                                <Zap size={14} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
