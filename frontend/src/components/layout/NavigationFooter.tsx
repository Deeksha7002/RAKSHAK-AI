import { Play, Database, ScanEye, BarChart3, Zap, Volume2, VolumeX, Link as LinkIcon, LogOut, Shield, Target, HelpCircle } from 'lucide-react';
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
    return (
        <div className="control-footer">
            {!isMonitoring ? (
                <button onClick={() => { onStartMonitoring(); soundManager.playClick(); }} className="btn btn-primary" style={{ width: '100%' }}>
                    <Play size={20} /> <span className="btn-text">INITIALIZE SYSTEM</span>
                </button>
            ) : (
                <div className="control-grid">
                    <button
                        onClick={() => { onToggleView('LOCKER'); soundManager.playClick(); }}
                        className={`btn btn-icon ${activeView === 'LOCKER' && !selectedThreadId ? 'active' : ''}`}
                        title="Intelligence Locker"
                    >
                        <Database size={20} />
                    </button>
                    <button
                        onClick={() => { onToggleView('FORENSICS'); soundManager.playClick(); }}
                        className={`btn btn-icon ${activeView === 'FORENSICS' && !selectedThreadId ? 'active' : ''}`}
                        title="Forensics Lab"
                    >
                        <ScanEye size={20} />
                    </button>
                    <button
                        onClick={() => { onToggleView('HONEY_TOKENS'); soundManager.playClick(); }}
                        className={`btn btn-icon ${activeView === 'HONEY_TOKENS' && !selectedThreadId ? 'active' : ''}`}
                        title="Honey-Token Generator"
                        style={{ color: '#ef4444' }}
                    >
                        <Target size={20} />
                    </button>
                    <button
                        onClick={() => { onToggleView('INTELLIGENCE'); soundManager.playClick(); }}
                        className={`btn btn-icon ${activeView === 'INTELLIGENCE' && !selectedThreadId ? 'active' : ''}`}
                        title="Monitor Intelligence"
                    >
                        <BarChart3 size={20} />
                    </button>
                    <button
                        onClick={() => { onToggleView('DEMO'); soundManager.playClick(); }}
                        className={`btn btn-icon ${activeView === 'DEMO' && !selectedThreadId ? 'active' : ''}`}
                        title="Test Lab (Demo Mode)"
                    >
                        <Zap size={20} />
                    </button>
                    <button
                        onClick={() => { onToggleMute(); soundManager.playClick(); }}
                        className={`btn btn-icon ${isMuted ? 'muted' : ''}`}
                        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button
                        onClick={() => { onToggleIntegration(); soundManager.playClick(); }}
                        className="btn btn-icon"
                        title="Connect Integrations"
                    >
                        <LinkIcon size={20} />
                    </button>
                    <button
                        onClick={() => { onOpenTour(); soundManager.playClick(); }}
                        className="btn btn-icon"
                        title="App Tutorial"
                        style={{ color: '#fbbf24' }}
                    >
                        <HelpCircle size={20} />
                    </button>
                    <button
                        onClick={() => { onToggleProtocol(); soundManager.playClick(); }}
                        className="btn btn-icon"
                        title="Security Protocol"
                        style={{ color: '#10b981' }}
                    >
                        <Shield size={20} />
                    </button>
                    <button
                        onClick={() => { onLogout(); soundManager.playClick(); }}
                        className="btn btn-icon btn-danger"
                        title="Terminate Session"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
