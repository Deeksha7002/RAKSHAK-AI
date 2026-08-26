import React from 'react';
import { Settings, Globe, Volume2, Moon, Sun, Lock, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageCode, getTranslation } from '../../lib/i18n';

interface SettingsViewProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentLang,
  onLanguageChange,
  voiceEnabled,
  onToggleVoice,
  theme,
  onToggleTheme
}) => {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={26} color="var(--primary)" />
          {getTranslation(currentLang, 'settingsTab')} & Accessibility
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
          Configure app language, voice assistance, and local privacy settings.
        </p>
      </div>

      {/* LANGUAGE SELECTOR CARD */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={20} color="var(--primary)" />
          Application Language (10 Indian Languages)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => onLanguageChange(l.code)}
              style={{
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${currentLang === l.code ? 'var(--primary)' : 'var(--border-color)'}`,
                background: currentLang === l.code ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                color: currentLang === l.code ? 'var(--primary)' : 'var(--text-primary)',
                fontWeight: currentLang === l.code ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.88rem'
              }}
            >
              <span>{l.flag}</span> {l.nativeName}
            </button>
          ))}
        </div>
      </div>

      {/* VOICE & ACCESSIBILITY CARD */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Volume2 size={20} color="var(--primary)" />
          Voice Readout & Accessibility
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Read Scan Results Aloud</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automatically uses Web Speech API text-to-speech for low literacy users</div>
          </div>
          <button onClick={onToggleVoice} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem' }}>
            {voiceEnabled ? '🟢 On' : '⚪ Off'}
          </button>
        </div>
      </div>

      {/* PRIVACY & DATA PURGE CARD */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} color="var(--status-success)" />
          Privacy & Data Protection
        </h3>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
          Rakshak AI scrubbed personal identity information (Aadhaar, PAN, Card PINs) locally on your device before performing scam analysis.
        </div>
        <button
          onClick={() => {
            if (confirm('Purge all local scan logs and saved reports?')) {
              localStorage.clear();
              alert('Local scan logs purged successfully.');
            }
          }}
          className="btn btn-outline"
          style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)', width: '100%' }}
        >
          <Trash2 size={18} /> Purge My Local Scan Logs
        </button>
      </div>
    </div>
  );
};
