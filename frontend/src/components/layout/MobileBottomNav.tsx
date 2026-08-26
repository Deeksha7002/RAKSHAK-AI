import React from 'react';
import { Home, Search, ShieldCheck, AlertTriangle, FileText, Settings } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';

export type CitizenTab = 'HOME' | 'SCAN' | 'PROTECT' | 'SOS' | 'REPORTS' | 'SETTINGS';

interface MobileBottomNavProps {
  activeTab: CitizenTab;
  onTabChange: (tab: CitizenTab) => void;
  currentLang: LanguageCode;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  currentLang
}) => {
  const tabs = [
    { id: 'HOME' as CitizenTab, label: getTranslation(currentLang, 'homeTab'), icon: Home },
    { id: 'SCAN' as CitizenTab, label: getTranslation(currentLang, 'scanTab'), icon: Search },
    { id: 'PROTECT' as CitizenTab, label: getTranslation(currentLang, 'protectTab'), icon: ShieldCheck },
    { id: 'SOS' as CitizenTab, label: getTranslation(currentLang, 'sosTab'), icon: AlertTriangle, isSos: true },
    { id: 'REPORTS' as CitizenTab, label: getTranslation(currentLang, 'reportsTab'), icon: FileText },
    { id: 'SETTINGS' as CitizenTab, label: getTranslation(currentLang, 'settingsTab'), icon: Settings },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-color)',
      padding: '0.4rem 0.5rem',
      boxShadow: '0 -4px 15px rgba(0,0,0,0.06)'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isSos) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  background: 'var(--status-danger)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.15rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={20} color="#fff" />
                <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>SOS</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                cursor: 'pointer',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={20} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.72rem' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
