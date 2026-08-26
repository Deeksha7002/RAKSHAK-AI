import React, { useState } from 'react';
import { MessageSquare, Send, CheckCheck, Info, ShieldCheck, Smartphone } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';

interface WhatsAppGatewayViewProps {
  currentLang: LanguageCode;
}

export const WhatsAppGatewayView: React.FC<WhatsAppGatewayViewProps> = ({ currentLang }) => {
  const [forwardText, setForwardText] = useState('Urgent: Your SBI account is blocked. Update KYC immediately at http://sbi-kyc-verify.top');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'bot'; text: string; verdict?: string }>>([
    { sender: 'bot', text: '👋 Namaste! I am Rakshak AI, your Digital Bodyguard. Forward any suspicious message, link, or image to check if it is a scam.' }
  ]);

  const handleSimulateForward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardText.trim()) return;

    const userMsg = forwardText.trim();
    setChatLog((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setForwardText('');

    setTimeout(() => {
      let botResponse = '🟢 SAFE: No known scam indicators found.';
      if (userMsg.toLowerCase().includes('kyc') || userMsg.toLowerCase().includes('sbi') || userMsg.toLowerCase().includes('http') || userMsg.toLowerCase().includes('urgent')) {
        botResponse = '🛑 LIKELY SCAM: This message is a phishing attempt pretending to be SBI. Do not click the link or share any OTP or banking credentials.';
      }
      setChatLog((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={22} color="#059669" />
        {getTranslation(currentLang, 'whatsappGatewayTitle')}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
        {getTranslation(currentLang, 'whatsappSubtitle')}
      </p>

      {/* WHATSAPP CHAT SIMULATOR WINDOW */}
      <div style={{
        background: '#efeae2',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginBottom: '1rem',
        minHeight: '220px',
        maxHeight: '300px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        border: '1px solid var(--border-color)'
      }}>
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'user' ? '#d9fdd3' : '#ffffff',
              color: '#111b21',
              padding: '0.65rem 0.85rem',
              borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              maxWidth: '85%',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              fontSize: '0.88rem',
              lineHeight: 1.4
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* SIMULATOR INPUT FORM */}
      <form onSubmit={handleSimulateForward} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <input
          type="text"
          value={forwardText}
          onChange={(e) => setForwardText(e.target.value)}
          placeholder="Type or paste suspicious text to forward..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            background: 'var(--bg-subtle)',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ background: '#059669' }}>
          <Send size={18} /> Forward
        </button>
      </form>

      {/* DEMARCATION NOTE */}
      <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Info size={14} /> Production Implementation Architecture
        </div>
        In production, this feature connects to the official <strong>WhatsApp Business Cloud API</strong>. Citizens forward messages to <code>+91 98765 43210</code> and receive automated Webhook responses without needing app installation.
      </div>
    </div>
  );
};
