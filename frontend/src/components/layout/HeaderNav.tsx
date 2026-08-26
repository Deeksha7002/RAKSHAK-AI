import React from 'react';
import { Shield, Globe, Volume2, Moon, Sun, Lock } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageCode, getTranslation } from '../../lib/i18n';

interface HeaderNavProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenLock?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentLang,
  onLanguageChange,
  voiceEnabled,
  onToggleVoice,
  theme,
  onToggleTheme,
  onOpenLock
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 1rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {getTranslation(currentLang, 'appTitle')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {getTranslation(currentLang, 'appTagline')}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Language Selector Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-subtle)', padding: '0.3rem 0.6rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <Globe size={16} color="var(--primary)" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Output Toggle */}
          <button
            onClick={onToggleVoice}
            title="Read results aloud"
            style={{
              background: voiceEnabled ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${voiceEnabled ? 'var(--primary)' : 'var(--border-color)'}`,
              color: voiceEnabled ? 'var(--primary)' : 'var(--text-muted)',
              borderRadius: '10px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Volume2 size={18} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
          </button>

          {onOpenLock && (
            <button
              onClick={onOpenLock}
              title="Operator lock"
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
