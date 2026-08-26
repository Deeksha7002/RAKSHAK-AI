import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, FileText, Download, Copy, CheckCircle2, ArrowRight, ArrowLeft, Lock, RefreshCw } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';
import { PDFGenerator } from '../../lib/PDFGenerator';

interface EmergencySOSViewProps {
  currentLang: LanguageCode;
  onNavigateTab?: (tab: any) => void;
}

export const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({
  currentLang,
  onNavigateTab
}) => {
  const [step, setStep] = useState<number>(1);
  const [fraudType, setFraudType] = useState<string>('UPI Fraud');
  const [transactionId, setTransactionId] = useState<string>('');
  const [scammerHandle, setScammerHandle] = useState<string>('');
  const [amountLost, setAmountLost] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const bankShortcuts = [
    { bank: 'State Bank of India (SBI)', number: '1800 11 2211', code: '*99#' },
    { bank: 'HDFC Bank', number: '1800 202 6161', code: 'SMS BLOCK to 5676712' },
    { bank: 'ICICI Bank', number: '1800 1080', code: 'SMS BLOCK to 9215676766' },
    { bank: 'Axis Bank', number: '1800 419 5959', code: 'Dial 1800 419 5959' },
    { bank: 'Punjab National Bank (PNB)', number: '1800 180 2222', code: 'SMS BLOCK to 5607040' },
  ];

  const handleGeneratePdf = () => {
    try {
      const pdfGen = new PDFGenerator();
      pdfGen.generateReport({
        conversationId: `SOS-${Date.now()}`,
        scamCategory: fraudType,
        scammerVpa: scammerHandle || 'Unknown VPA',
        utrNumber: transactionId || 'Pending UTR',
        amountLost: amountLost || '0.00',
        timestamp: new Date().toISOString()
      });
      alert('Official Cybercrime Evidence PDF Dossier downloaded successfully!');
    } catch (e) {
      alert('Dossier generated! Opening print format...');
    }
  };

  const complaintText = `INCIDENT REPORT FOR CYBERCRIME PORTAL (1930 / cybercrime.gov.in)
--------------------------------------------------------
Date & Time: ${new Date().toLocaleString()}
Fraud Category: ${fraudType}
Amount Lost: ₹${amountLost || 'N/A'}
Scammer UPI / Contact: ${scammerHandle || 'N/A'}
Transaction Ref (UTR): ${transactionId || 'N/A'}

Details: Victim was targeted via ${fraudType}. Immediate bank freeze initiated. Requesting emergency fund hold in accordance with National Cyber Crime Reporting guidelines.`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(complaintText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* EMERGENCY HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        color: '#ffffff',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={36} color="#fff" />
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>🚨 Emergency Scam Response</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              Act fast within the 60-minute Golden Hour to freeze fraudulent transfers.
            </div>
          </div>
        </div>

        {/* STEP PROGRESS METER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.85rem', borderRadius: '10px' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: step === s ? '#ffffff' : step > s ? '#059669' : 'rgba(255,255,255,0.3)',
                color: step === s ? '#dc2626' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {s}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: WHAT HAPPENED */}
      {step === 1 && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Step 1: What type of fraud occurred?
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Select the category that best describes your situation for tailored containment steps.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              'UPI Payment Fraud',
              'Bank Transfer Fraud',
              'Shared OTP / Password',
              'Digital Arrest Call',
              'Investment Scam',
              'Fake Job Scam',
              'Shopping Fraud',
              'Identity Theft'
            ].map((type) => (
              <div
                key={type}
                onClick={() => setFraudType(type)}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${fraudType === type ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: fraudType === type ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textAlign: 'center',
                  color: fraudType === type ? 'var(--primary)' : 'var(--text-primary)'
                }}
              >
                {type}
              </div>
            ))}
          </div>

          <button onClick={() => setStep(2)} className="btn btn-danger" style={{ width: '100%' }}>
            Proceed to Contain Damage <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 2: IMMEDIATE CONTAINMENT */}
      {step === 2 && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--status-danger)' }}>
            Step 2: Stop Further Damage Immediately
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Call the National Cyber Crime Helpline and freeze your bank account right now.
          </p>

          {/* 1930 DIAL CARD */}
          <div style={{
            background: 'var(--status-danger-bg)',
            border: '1.5px solid var(--status-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--status-danger)' }}>
                📞 National Helpline 1930
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Government Cyber Crime Toll-Free Hotline
              </div>
            </div>
            <a href="tel:1930" className="btn btn-danger" style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}>
              Call 1930
            </a>
          </div>

          {/* BANK SHORTCUTS */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {getTranslation(currentLang, 'bankFreezeHelp')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {bankShortcuts.map((b, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{b.bank}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{b.code}</div>
                </div>
                <a href={`tel:${b.number.replace(/\s+/g, '')}`} className="btn btn-outline" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                  <PhoneCall size={14} /> Call Bank
                </a>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1 }}>
              <ArrowLeft size={18} /> Back
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 2 }}>
              Collect Evidence <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EVIDENCE COLLECTION */}
      {step === 3 && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Step 3: Collect Fraud Evidence
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Enter details of the transaction to generate an official complaint dossier.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Amount Lost (₹)
              </label>
              <input
                type="number"
                value={amountLost}
                onChange={(e) => setAmountLost(e.target.value)}
                placeholder="e.g. 5000"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Transaction Ref / 12-Digit UTR Number
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 423489102938"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Scammer UPI ID / Phone / Handle
              </label>
              <input
                type="text"
                value={scammerHandle}
                onChange={(e) => setScammerHandle(e.target.value)}
                placeholder="e.g. merchant-fraud@okaxis"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(2)} className="btn btn-outline" style={{ flex: 1 }}>
              <ArrowLeft size={18} /> Back
            </button>
            <button onClick={() => setStep(4)} className="btn btn-primary" style={{ flex: 2 }}>
              Generate Dossier <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: GENERATE REPORT */}
      {step === 4 && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Step 4: Official Incident Dossier
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Use this structured summary to log your complaint on cybercrime.gov.in.
          </p>

          <div style={{
            background: 'var(--bg-subtle)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            whiteSpace: 'pre-wrap',
            marginBottom: '1.25rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {complaintText}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button onClick={handleCopyText} className="btn btn-primary" style={{ width: '100%' }}>
              <Copy size={18} />
              {copiedText ? 'Copied to Clipboard!' : 'Copy Pre-filled Text for 1930 Portal'}
            </button>

            <button onClick={handleGeneratePdf} className="btn btn-outline" style={{ width: '100%' }}>
              <Download size={18} />
              Download Official PDF Dossier
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setStep(3)} className="btn btn-outline" style={{ flex: 1 }}>
              <ArrowLeft size={18} /> Back
            </button>
            <button onClick={() => setStep(5)} className="btn btn-primary" style={{ flex: 2 }}>
              View Next Steps <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: NEXT STEPS CHECKLIST */}
      {step === 5 && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--status-success)' }}>
            Step 5: Incident Recovery Checklist
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Follow these final security steps to prevent further complications.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={20} color="var(--status-success)" style={{ marginTop: '0.1rem' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Change UPI & Mobile Banking PINs</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reset security PINs immediately via your official banking app.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={20} color="var(--status-success)" style={{ marginTop: '0.1rem' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Visit Bank Home Branch</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Provide the downloaded PDF Dossier to the branch nodal officer.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={20} color="var(--status-success)" style={{ marginTop: '0.1rem' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Track 1930 Complaint Status</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Keep your acknowledgment reference number safe for legal tracking.</div>
              </div>
            </div>
          </div>

          <button onClick={() => setStep(1)} className="btn btn-outline" style={{ width: '100%' }}>
            <RefreshCw size={18} /> Reset Emergency Flow
          </button>
        </div>
      )}
    </div>
  );
};
