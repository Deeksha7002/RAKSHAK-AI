import { useState, Suspense, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { InboxList } from './components/InboxList';
import { LoginScreen } from './components/LoginScreen';
import { LockScreen } from './components/LockScreen';
import { SystemDashboard } from './components/SystemDashboard';
import { LiveIntercept } from './components/LiveIntercept';
import { IntelligenceView } from './components/views/IntelligenceView';
import { ForensicsView } from './components/views/ForensicsView';
import { TestLabView } from './components/views/TestLabView';
import { EvidenceLockerView } from './components/views/EvidenceLockerView';
import { NavigationFooter } from './components/layout/NavigationFooter';
import { IntegrationGuide } from './components/IntegrationGuide';
import { SecurityProtocolModal } from './components/SecurityProtocolModal';
import { HoneyTokenGenerator } from './components/HoneyTokenGenerator';
import { OnboardingTour } from './components/OnboardingTour';
import { useAuth } from './context/AuthContext';
import { useThreads } from './context/ThreadProvider';
import { useRakshakCore } from './hooks/useRakshakCore';
import { soundManager } from './lib/SoundManager';
import { Shield, ChevronLeft, ShieldAlert, HelpCircle, VolumeX, Volume2, LogOut } from 'lucide-react';
import type { Thread } from './lib/types';
import './index.css';

import { IntelligenceService } from './lib/IntelligenceService';

type ViewState = 'DASHBOARD' | 'LOCKER' | 'FORENSICS' | 'INTELLIGENCE' | 'DEMO' | 'HONEY_TOKENS';

function App() {
  const { clearThreads } = useThreads();
  const { isAuthenticated, logout } = useAuth();
  const {
    threads,
    isMonitoring,
    notification,
    startMonitoring,
    stopMonitoring,
    triggerBotnetMode,
    getCaseFiles,
    wsStatus
  } = useRakshakCore();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [sidebarTab, setSidebarTab] = useState<'INBOX' | 'COMMAND'>('INBOX');
  const [isMuted, setIsMuted] = useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    IntelligenceService.init();
  }, []);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('rakshak_tour_shown');
    if (isAuthenticated && !hasSeenTour) {
      setIsTourOpen(true);
      localStorage.setItem('rakshak_tour_shown', 'true');
    }
  }, [isAuthenticated]);

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const handleLogout = () => {
    logout();
    clearThreads();
    setSelectedThreadId(null);
    stopMonitoring();
    setActiveView('DASHBOARD');
  };

  if (!isAuthenticated) return <LoginScreen />;
  if (isLocked) return <LockScreen onUnlock={() => setIsLocked(false)} />;

  return (
    <>
      {notification && (
        <div className="notification-toast">
          <Shield className="shrink-0" size={20} />
          {notification}
        </div>
      )}

      <div className="messenger-container" data-mobile-view={selectedThreadId ? 'chat' : 'list'}>
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* TAB SWITCHER UI */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
             <button 
                onClick={() => { setSidebarTab('INBOX'); soundManager.playClick(); }}
                style={{ flex: 1, padding: '14px 0', background: sidebarTab === 'INBOX' ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: sidebarTab === 'INBOX' ? '2px solid var(--primary)' : '2px solid transparent', color: sidebarTab === 'INBOX' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.2s' }}
             >
                INBOX
             </button>
             <button 
                onClick={() => { setSidebarTab('COMMAND'); soundManager.playClick(); }}
                style={{ flex: 1, padding: '14px 0', background: sidebarTab === 'COMMAND' ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderBottom: sidebarTab === 'COMMAND' ? '2px solid #ec4899' : '2px solid transparent', color: sidebarTab === 'COMMAND' ? '#ec4899' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', transition: 'all 0.2s' }}
             >
                COMMAND CENTER
             </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: sidebarTab === 'INBOX' ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden' }}>
              <InboxList
                threads={threads.map((t: Thread) => ({
                  id: t.id,
                  senderName: t.senderName,
                  source: t.source,
                  lastMessage: t.messages[t.messages.length - 1]?.content || '',
                  classification: t.classification,
                  isIntercepted: t.isIntercepted,
                  persona: t.persona,
                  autoReported: t.autoReported,
                  isCompromised: t.isCompromised,
                  isBlocked: t.isBlocked
                }))}
                selectedThreadId={selectedThreadId}
                onSelectThread={(id) => {
                  if (id === 'DASHBOARD_VIEW') {
                    setSelectedThreadId(null);
                    setActiveView('DASHBOARD');
                  } else {
                    setSelectedThreadId(id);
                  }
                }}
                onBack={() => {
                  setSelectedThreadId(null);
                  setActiveView('DASHBOARD');
                }}
              />
            </div>
            
            <div style={{ flex: 1, display: sidebarTab === 'COMMAND' ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden' }}>
              <NavigationFooter
                isMonitoring={isMonitoring}
                activeView={activeView}
                selectedThreadId={selectedThreadId}
                isMuted={isMuted}
                onStartMonitoring={startMonitoring}
                onToggleView={(view) => { setActiveView(view); setSelectedThreadId(null); }}
                onToggleMute={() => setIsMuted(soundManager.toggleMute())}
                onToggleIntegration={() => setIsIntegrationOpen(true)}
                onToggleProtocol={() => setIsProtocolOpen(true)}
                onOpenTour={() => setIsTourOpen(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>

          {/* ACCOUNT & PREFERENCES STRIP (Permanently docked at bottom of sidebar) */}
          <div style={{ padding: '0.6rem 1rem', display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
              <button
                  onClick={() => { setIsTourOpen(true); soundManager.playClick(); }}
                  title="App Tutorial"
                  className="btn-icon"
                  style={{ flex: 1, height: '36px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}
              >
                  <HelpCircle size={16} color="#fbbf24" />
              </button>
              <button
                  onClick={() => { setIsMuted(soundManager.toggleMute()); soundManager.playClick(); }}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  className="btn-icon"
                  style={{ flex: 1, height: '36px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}
              >
                  {isMuted ? <VolumeX size={16} color="#94a3b8" /> : <Volume2 size={16} color="#94a3b8" />}
              </button>
              <button
                  onClick={() => { handleLogout(); soundManager.playClick(); }}
                  title="Terminate Session"
                  className="btn-icon"
                  style={{ flex: 1, height: '36px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}
              >
                  <LogOut size={16} color="#ef4444" />
              </button>
          </div>
          
        </div>

        <div className="main-chat">
          {selectedThreadId && selectedThread ? (
            <>
              <div className="chat-banner" data-status={
                selectedThread.classification === 'scam' || selectedThread.classification === 'likely_scam' ? 'scam' :
                  selectedThread.classification === 'benign' ? 'safe' : 'neutral'
              }>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    className="mobile-back-btn"
                    onClick={() => { setSelectedThreadId(null); setActiveView('DASHBOARD'); }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div>
                    <div className="sender-name">
                      {selectedThread.senderName}
                      <span className={`status-dot ${wsStatus}`} title={`Uplink: ${wsStatus}`} />
                    </div>
                    <div className="sender-source">{selectedThread.source}</div>
                  </div>
                </div>
                <div>
                  {selectedThread.isScanning && <span className="status-scanning">Scanning...</span>}
                  {!selectedThread.isScanning && selectedThread.classification === 'benign' && !selectedThread.isIntercepted && <span className="status-safe">✓ Verified Safe</span>}
                  {!selectedThread.isScanning && (selectedThread.classification === 'scam' || selectedThread.classification === 'likely_scam') && (
                    <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>🔴 HIGH RISK</span>
                  )}
                  {selectedThread.autoReported && (
                    <span className="status-reported">AUTO-REPORTED ✅</span>
                  )}
                </div>
              </div>

              {selectedThread.isCompromised && (
                <div className="compromise-alert-banner">
                  <div className="compromise-alert-content">
                    <div style={{ background: 'var(--status-danger)', color: 'white', padding: '4px', borderRadius: '4px' }}>
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <div className="compromise-alert-title">KNOWN CONTACT COMPROMISED</div>
                      <div className="compromise-alert-desc">Behavior anomaly detected for {selectedThread.senderName}.</div>
                    </div>
                  </div>
                  <button onClick={() => { setActiveView('LOCKER'); setSelectedThreadId(null); }} className="btn-danger-glow compromise-alert-btn">
                    REPORT COMPROMISE
                  </button>
                </div>
              )}

              {selectedThread.isIntercepted && (
                <LiveIntercept
                  intent={selectedThread.intent || "ANALYZING..."}
                  threatScore={selectedThread.threatScore || 0}
                  isScanning={selectedThread.isScanning}
                  location={selectedThread.detectedLocation}
                  neuralMatrixHistory={selectedThread.neuralMatrixHistory}
                  counterMeasure={
                    selectedThread.intent === "MONEY" ? "TRACE_PAYMENT" :
                      selectedThread.intent === "CODES" ? "INJECT_FAKE_OTP" :
                        selectedThread.intent === "URGENCY" ? "STALLING_PROTOCOL" : "MONITORING"
                  }
                />
              )}

              <div className="chat-viewport">
                <ChatWindow messages={selectedThread.messages} />
              </div>
            </>
          ) : (
            <>
              {activeView === 'LOCKER' && (
                <Suspense fallback={<div>Loading Secure Module...</div>}>
                  <EvidenceLockerView cases={getCaseFiles()} onClose={() => setActiveView('DASHBOARD')} />
                </Suspense>
              )}
              {activeView === 'FORENSICS' && <ForensicsView />}
              {activeView === 'INTELLIGENCE' && <IntelligenceView />}
              {activeView === 'DEMO' && <TestLabView />}
              {activeView === 'HONEY_TOKENS' && <HoneyTokenGenerator />}
              {activeView === 'DASHBOARD' && (
                <SystemDashboard
                  activeThreats={threads.filter(t => t.classification === 'scam' || t.classification === 'likely_scam').length}
                  locations={threads.filter(t => (t.classification === 'scam' || t.classification === 'likely_scam') && t.detectedLocation).map(t => t.detectedLocation!)}
                  onSimulateAttack={triggerBotnetMode}
                />
              )}
            </>
          )}
        </div>
      </div>
      <IntegrationGuide isOpen={isIntegrationOpen} onClose={() => setIsIntegrationOpen(false)} />
      <SecurityProtocolModal isOpen={isProtocolOpen} onClose={() => setIsProtocolOpen(false)} />
      <OnboardingTour 
        isOpen={isTourOpen} 
        onClose={() => { 
          setIsTourOpen(false); 
          setActiveView('DASHBOARD'); 
          setSelectedThreadId(null); 
        }} 
        onSwitchView={(view: ViewState) => { setActiveView(view); setSelectedThreadId(null); }} 
      />
    </>
  );
}

export default App;
