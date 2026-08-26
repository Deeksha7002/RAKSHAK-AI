import React, { useState } from 'react';
import { AlertTriangle, Search, ShieldCheck, CreditCard, MessageSquare, Users, Mic, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';

interface CitizenHomeViewProps {
  currentLang: LanguageCode;
  onNavigateTab: (tab: any) => void;
  onQuickScan: (query: string) => void;
}

export const CitizenHomeView: React.FC<CitizenHomeViewProps> = ({
  currentLang,
  onNavigateTab,
  onQuickScan
}) => {
  const [quickInput, setQuickInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickScan(quickInput);
    onNavigateTab('SCAN');
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* 🚨 HIGH VISIBILITY EMERGENCY SOS BUTTON */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        color: '#ffffff',
        boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }}
      onClick={() => onNavigateTab('SOS')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} className="sos-pulse">
            <AlertTriangle size={30} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.01em' }}>
              {getTranslation(currentLang, 'sosButtonTitle')}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.15rem' }}>
              {getTranslation(currentLang, 'sosButtonSubtitle')}
            </div>
          </div>
        </div>
        <ChevronRight size={28} color="#fff" />
      </div>

      {/* 🔍 UNIVERSAL QUICK SCANNER CARD */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={20} color="var(--primary)" />
          {getTranslation(currentLang, 'quickScanHeader')}
        </h2>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <textarea
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder={getTranslation(currentLang, 'scanPlaceholder')}
              rows={3}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Search size={18} />
            {getTranslation(currentLang, 'checkButton')}
          </button>
        </form>
      </div>

      {/* 🛡️ DIGITAL PROTECTION STATUS CARD */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--status-success-bg)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {getTranslation(currentLang, 'healthScoreLabel')}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={18} /> 95/100 • {getTranslation(currentLang, 'protectedText')}
              </div>
            </div>
          </div>
          <span className="badge badge-success">Active</span>
        </div>
      </div>

      {/* ⚡ QUICK FEATURE TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('PROTECT')}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '0.65rem' }}>
            <CreditCard size={20} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>UPI & VPA Check</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Verify payment handles</div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('PROTECT')}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '0.65rem' }}>
            <MessageSquare size={20} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>WhatsApp Bot</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Forward messages to check</div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('PROTECT')}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', marginBottom: '0.65rem' }}>
            <Users size={20} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Family Shield</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Protect elderly parents</div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('PROTECT')}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(147, 51, 234, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', marginBottom: '0.65rem' }}>
            <Mic size={20} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Voice Check</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Detect cloned voices</div>
        </div>
      </div>

      {/* 📢 LOCAL TRENDING SCAM ALERTS */}
      <div className="card" style={{ background: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
          <AlertTriangle size={18} color="var(--status-warning)" />
          Trending Scam Alerts Near You
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--status-warning)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>⚡ Electricity Bill Disconnection SMS</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Fraudsters sending fake SMS claiming power will be cut tonight unless paid via an unverified APK/link.
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--status-danger)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>👮 Fake CBI "Digital Arrest" Video Calls</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Scammers posing as law enforcement on Skype asking victims to stay on video call and transfer money.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
