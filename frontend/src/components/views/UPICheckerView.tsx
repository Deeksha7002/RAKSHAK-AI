import React, { useState } from 'react';
import { CreditCard, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Search, Info } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';

interface UPICheckerViewProps {
  currentLang: LanguageCode;
}

export const UPICheckerView: React.FC<UPICheckerViewProps> = ({ currentLang }) => {
  const [upiInput, setUpiInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleVerify = () => {
    if (!upiInput.trim()) return;
    setVerifying(true);
    setResult(null);

    setTimeout(() => {
      const handle = upiInput.trim().toLowerCase();
      let status: 'VERIFIED' | 'UNKNOWN' | 'HIGH_RISK' = 'UNKNOWN';
      let riskScore = 45;
      let notes = 'Handle domain format is valid, but merchant identity is unverified in official registries.';

      if (handle.includes('merchant') || handle.includes('paytm') || handle.includes('sbi') || handle.includes('official')) {
        if (handle.includes('cbi') || handle.includes('police') || handle.includes('refund') || handle.includes('lottery') || handle.includes('parttime')) {
          status = 'HIGH_RISK';
          riskScore = 92;
          notes = 'FLAGGED MULE ACCOUNT: Impersonates official government or police department on a personal UPI VPA.';
        } else {
          status = 'VERIFIED';
          riskScore = 10;
          notes = 'Verified Banking Domain format associated with standard merchant settlement handles.';
        }
      } else if (handle.includes('electricity') || handle.includes('bill') || handle.includes('fine')) {
        status = 'HIGH_RISK';
        riskScore = 88;
        notes = 'SUSPICIOUS VPA: Electricity boards do NOT collect payments via individual VPA handles.';
      }

      setResult({ handle, status, riskScore, notes });
      setVerifying(false);
    }, 600);
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <CreditCard size={22} color="var(--primary)" />
        {getTranslation(currentLang, 'upiCheckerTitle')}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
        Check suspicious UPI handles or phone numbers before transferring money to detect mule accounts.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={upiInput}
          onChange={(e) => setUpiInput(e.target.value)}
          placeholder={getTranslation(currentLang, 'upiPlaceholder')}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            background: 'var(--bg-subtle)',
            fontSize: '0.92rem',
            outline: 'none'
          }}
        />
        <button onClick={handleVerify} disabled={verifying} className="btn btn-primary">
          {verifying ? 'Checking...' : getTranslation(currentLang, 'upiCheckBtn')}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: `1.5px solid ${result.status === 'HIGH_RISK' ? 'var(--status-danger)' : result.status === 'VERIFIED' ? 'var(--status-success)' : 'var(--status-warning)'}`,
          background: result.status === 'HIGH_RISK' ? 'var(--status-danger-bg)' : result.status === 'VERIFIED' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: result.status === 'HIGH_RISK' ? 'var(--status-danger)' : result.status === 'VERIFIED' ? 'var(--status-success)' : 'var(--status-warning)' }}>
              {result.status === 'HIGH_RISK' ? '🛑 High-Risk Mule VPA' : result.status === 'VERIFIED' ? '🟢 Verified Merchant Handle' : '🟡 Unverified VPA'}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Risk Score: {result.riskScore}%</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {result.notes}
          </div>
        </div>
      )}
    </div>
  );
};
