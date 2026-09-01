import { useState, useEffect } from 'react';
import { HeaderNav } from './components/layout/HeaderNav';
import { MobileBottomNav, type CitizenTab } from './components/layout/MobileBottomNav';
import { CitizenHomeView } from './components/views/CitizenHomeView';
import { UniversalScannerView } from './components/views/UniversalScannerView';
import { EmergencySOSView } from './components/views/EmergencySOSView';
import { UPICheckerView } from './components/views/UPICheckerView';
import { WhatsAppGatewayView } from './components/views/WhatsAppGatewayView';
import { FamilyShieldView } from './components/views/FamilyShieldView';
import { VoiceCheckerView } from './components/views/VoiceCheckerView';
import { CitizenReportsView } from './components/views/CitizenReportsView';
import { SettingsView } from './components/views/SettingsView';
import { type LanguageCode } from './lib/i18n';
import { Lock } from 'lucide-react';
import { DEMO_ACCESS_KEY } from './lib/config';
import './index.css';

interface OperatorGateProps {
  onAuthorize: () => void;
}

const OperatorGate = ({ onAuthorize }: OperatorGateProps) => {
    const [key, setKey] = useState<string>('');
    const [error, setError] = useState<boolean>(false);

    const handleSubmit = (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (key.trim().toUpperCase() === DEMO_ACCESS_KEY.toUpperCase()) {
            onAuthorize();
        } else {
            setError(true);
            setTimeout(() => setError(false), 1000);
        }
    };

    return (
        <div style={{
            height: '100vh', width: '100vw', background: '#0f172a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'fixed', top: 0, left: 0, zIndex: 9999, color: '#fff'
        }}>
            <div style={{
                width: '320px', padding: '2rem', background: '#1e293b',
                border: `1px solid ${error ? '#ef4444' : '#334155'}`,
                borderRadius: '16px', textAlign: 'center'
            }}>
                <Lock size={32} color={error ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto 1rem auto' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>OPERATOR GATEWAY</h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Enter system access key to unlock developer mode</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={key}
                        onChange={(e: { target: { value: string } }) => setKey(e.target.value)}
                        style={{
                            width: '100%', padding: '10px', background: '#0f172a',
                            border: '1px solid #334155', borderRadius: '8px',
                            color: '#fff', fontSize: '1rem', textAlign: 'center',
                            outline: 'none', marginBottom: '1rem'
                        }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        UNLOCK SYSTEM
                    </button>
                </form>
            </div>
        </div>
    );
};

export function App() {
  const [activeTab, setActiveTab] = useState<CitizenTab>('HOME');
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [quickScanQuery, setQuickScanQuery] = useState<string>('');
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [showLock, setShowLock] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev: 'light' | 'dark') => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleToggleVoice = () => {
    setVoiceEnabled((prev: boolean) => !prev);
  };

  const handleQuickScan = (query: string) => {
    setQuickScanQuery(query);
    setActiveTab('SCAN');
  };

  const handleSaveReport = (reportData: any) => {
    setSavedReports((prev: any[]) => [reportData, ...prev]);
  };

  if (showLock) {
    return <OperatorGate onAuthorize={() => setShowLock(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <HeaderNav
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenLock={() => setShowLock(true)}
      />

      {/* Main Content Area */}
      <main style={{ padding: '1rem 0 5rem 0' }}>
        {activeTab === 'HOME' && (
          <CitizenHomeView
            currentLang={currentLang}
            onNavigateTab={setActiveTab}
            onQuickScan={handleQuickScan}
          />
        )}

        {activeTab === 'SCAN' && (
          <UniversalScannerView
            currentLang={currentLang}
            initialQuery={quickScanQuery}
            onSaveReport={handleSaveReport}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'PROTECT' && (
          <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                Digital Fraud Protection Suite
              </h1>
              <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                Verify payments, forward WhatsApp messages, protect family members, and analyze suspicious voice notes.
              </p>
            </div>

            <UPICheckerView currentLang={currentLang} />
            <WhatsAppGatewayView currentLang={currentLang} />
            <FamilyShieldView currentLang={currentLang} />
            <VoiceCheckerView currentLang={currentLang} />
          </div>
        )}

        {activeTab === 'SOS' && (
          <EmergencySOSView
            currentLang={currentLang}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'REPORTS' && (
          <CitizenReportsView
            currentLang={currentLang}
            savedReports={savedReports}
          />
        )}

        {activeTab === 'SETTINGS' && (
          <SettingsView
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            voiceEnabled={voiceEnabled}
            onToggleVoice={handleToggleVoice}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}
      </main>

      {/* 5-Tab Bottom Mobile Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentLang={currentLang}
      />
    </div>
  );
}

export default App;
