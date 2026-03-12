import { Play, Database, ScanEye, BarChart3, Zap, Volume2, VolumeX, Link as LinkIcon, LogOut } from 'lucide-react';

interface NavigationFooterProps {
    isMonitoring: boolean;
    activeView: string;
    selectedThreadId: string | null;
    isMuted: boolean;
    onStartMonitoring: () => void;
    onToggleView: (view: 'DASHBOARD' | 'LOCKER' | 'FORENSICS' | 'INTELLIGENCE' | 'DEMO') => void;
    onToggleMute: () => void;
    onToggleIntegration: () => void;
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
    onLogout
}: NavigationFooterProps) {
    return (
        <div className="control-footer">
            {!isMonitoring ? (
                <button onClick={onStartMonitoring} className="btn btn-primary" style={{ width: '100%' }}>
                    <Play size={20} /> <span className="btn-text">INITIALIZE SYSTEM</span>
                </button>
            ) : (
                <div className="control-grid">
                    <button
                        onClick={() => onToggleView('LOCKER')}
                        className={`btn btn-icon ${activeView === 'LOCKER' && !selectedThreadId ? 'active' : ''}`}
                        title="Intelligence Locker"
                    >
                        <Database size={20} />
                    </button>
                    <button
                        onClick={() => onToggleView('FORENSICS')}
                        className={`btn btn-icon ${activeView === 'FORENSICS' && !selectedThreadId ? 'active' : ''}`}
                        title="Forensics Lab"
                    >
                        <ScanEye size={20} />
                    </button>
                    <button
                        onClick={() => onToggleView('INTELLIGENCE')}
                        className={`btn btn-icon ${activeView === 'INTELLIGENCE' && !selectedThreadId ? 'active' : ''}`}
                        title="Monitor Intelligence"
                    >
                        <BarChart3 size={20} />
                    </button>
                    <button
                        onClick={() => onToggleView('DEMO')}
                        className={`btn btn-icon ${activeView === 'DEMO' && !selectedThreadId ? 'active' : ''}`}
                        title="Test Lab (Demo Mode)"
                    >
                        <Zap size={20} />
                    </button>
                    <button
                        onClick={onToggleMute}
                        className={`btn btn-icon ${isMuted ? 'muted' : ''}`}
                        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button
                        onClick={onToggleIntegration}
                        className="btn btn-icon"
                        title="Connect Integrations"
                    >
                        <LinkIcon size={20} />
                    </button>
                    <button
                        onClick={onLogout}
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
