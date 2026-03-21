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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    IntelligenceService.init();
  }, []);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('rakshak_tour_shown');
    if (isAuthenticated) {
      if (!isMonitoring) startMonitoring();
      if (!hasSeenTour) {
        setIsTourOpen(true);
        localStorage.setItem('rakshak_tour_shown', 'true');
      }
    }
  }, [isAuthenticated, isMonitoring, startMonitoring]);

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

  // ==========================================
  // SIDEBAR TEMPLATE (Wrapped in Function to fix startup crash)
  // ==========================================
  const renderSidebar = () => (
    <div className="sidebar" style={{ display: isMobile && selectedThreadId ? 'none' : 'flex', flexDirection: 'column' }}>
      
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
            activeView={activeView}
            selectedThreadId={selectedThreadId}
            onToggleView={(view) => { setActiveView(view); setSelectedThreadId(null); }}
            onToggleIntegration={() => setIsIntegrationOpen(true)}
            onToggleProtocol={() => setIsProtocolOpen(true)}
          />
        </div>
      </div>

      <div style={{ padding: '0.6rem 1rem', display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
          <button onClick={() => { setIsTourOpen(true); soundManager.playClick(); }} className="btn-icon" style={{ flex: 1, height: '36px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}><HelpCircle size={16} color="#fbbf24" /></button>
          <button onClick={() => { setIsMuted(soundManager.toggleMute()); soundManager.playClick(); }} className="btn-icon" style={{ flex: 1, height: '36px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>{isMuted ? <VolumeX size={16} color="#94a3b8" /> : <Volume2 size={16} color="#94a3b8" />}</button>
          <button onClick={() => { handleLogout(); soundManager.playClick(); }} className="btn-icon" style={{ flex: 1, height: '36px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}><LogOut size={16} color="#ef4444" /></button>
      </div>
    </div>
  );

  if (!isInitialized) {
    return (
      <div className="system-boot-screen" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'radial-gradient(circle at center, #0B1120 0%, #040914 100%)',
        color: '#fff', gap: '1.5rem', padding: '2rem', textAlign: 'center'
      }}>
        <div className="glowing-orb" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(56, 189, 248, 0.3)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <Shield size={40} className="animate-pulse" color="#38bdf8" />
        </div>
        <h1 style={{ letterSpacing: '2px', fontWeight: 800, margin: 0, fontSize: '1.5rem', textTransform: 'uppercase' }}>RAKSHAK-AI SYSTEM</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.9rem', lineHeight: '1.5' }}>Advanced honey-token and scam interceptor defense ready for deployment setup.</p>
        <button onClick={() => { setIsInitialized(true); setIsTourOpen(true); startMonitoring(); }} className="btn-primary-glow" style={{ padding: '0.8rem 2rem', fontSize: '1rem', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          INITIALIZE DEFENSES
        </button>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <div className="notification-toast">
          <Shield className="shrink-0" size={20} />
          {notification}
        </div>
      )}

      <div className="messenger-container" data-mobile-view={selectedThreadId ? 'chat' : 'list'}>
        {isMobile && selectedThreadId && selectedThread ? (
          /* ==========================================
             MOBILE VIEWPORT CHAT OVERLAY
             ========================================== */
          <div className="mobile-chat-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="chat-banner" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button className="mobile-back-btn" onClick={() => { setSelectedThreadId(null); setActiveView('DASHBOARD'); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedThread.senderName}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{selectedThread.source}</div>
                </div>
              </div>
            </div>

            {selectedThread.isIntercepted && (
              <div className="mobile-compact-stats" style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto', flexWrap: 'nowrap' }}>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', whiteSpace: 'nowrap' }}>
                  🚨 {selectedThread.threatScore || 0}% RISK
                </span>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', whiteSpace: 'nowrap' }}>
                  🎯 {selectedThread.intent || "SCAN"}
                </span>
              </div>
            )}

            <div className="chat-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
              <ChatWindow messages={selectedThread.messages} />
            </div>
          </div>
        ) : (
          renderSidebar()
        )}

        <div className="main-chat" style={{ display: isMobile ? 'none' : 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                    <span className="status-reported" style={{ marginLeft: '0.5rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                       {selectedThread.persona === 'INVESTOR' ? '📈 INVESTOR' :
                        selectedThread.persona === 'CITIZEN' ? '⚖ CITIZEN' :
                        selectedThread.persona === 'SKEPTICAL' ? '🤨 SKEPTICAL' : '👴 ELDERLY'}
                    </span>
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

              {isMobile ? (
                <div className="mobile-chat-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '0', flexGrow: 1, overflow: 'hidden' }}>
                  {selectedThread.isIntercepted && (
                    <div className="mobile-compact-stats" style={{
                      display: 'flex', gap: '0.5rem', padding: '0.75rem', 
                      background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      overflowX: 'auto', flexWrap: 'nowrap'
                    }}>
                      <span className="compact-badge" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', whiteSpace: 'nowrap' }}>
                        🚨 {selectedThread.threatScore || 0}% THREAT
                      </span>
                      <span className="compact-badge" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', whiteSpace: 'nowrap' }}>
                        🎯 {selectedThread.intent || "ANALYZING"}
                      </span>
                      {selectedThread.detectedLocation?.city && (
                        <span className="compact-badge" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', whiteSpace: 'nowrap' }}>
                          📍 {selectedThread.detectedLocation.city}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="chat-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
                    <ChatWindow messages={selectedThread.messages} />
                  </div>
                </div>
              ) : (
                <div className="chat-split-view">
                  <div className="chat-left-pane">
                    <div className="chat-viewport">
                      <ChatWindow messages={selectedThread.messages} />
                    </div>
                  </div>

                  {selectedThread.isIntercepted && (
                    <div className="live-analysis-right-pane">
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
                    </div>
                  )}
                </div>
              )}
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
