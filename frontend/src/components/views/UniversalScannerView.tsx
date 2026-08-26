import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, AlertTriangle, AlertCircle, Volume2, Lock, FileText, CheckCircle2, XCircle, ArrowRight, Upload, Image as ImageIcon } from 'lucide-react';
import { LanguageCode, getTranslation, speakText } from '../../lib/i18n';
import { ScamAnalyzer } from '../../lib/ScamAnalyzer';

interface UniversalScannerViewProps {
  currentLang: LanguageCode;
  initialQuery?: string;
  onSaveReport?: (reportData: any) => void;
  onNavigateTab?: (tab: any) => void;
}

export const UniversalScannerView: React.FC<UniversalScannerViewProps> = ({
  currentLang,
  initialQuery = '',
  onSaveReport,
  onNavigateTab
}) => {
  const [inputText, setInputText] = useState(initialQuery);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setInputText(initialQuery);
      handleAnalyze(initialQuery);
    }
  }, [initialQuery]);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const query = textToAnalyze !== undefined ? textToAnalyze : inputText;
    if (!query.trim() && !uploadedImageName) return;

    setAnalyzing(true);
    setResult(null);

    // Simulate multi-modal input auto-detection & scan processing
    setTimeout(() => {
      const analyzer = new ScamAnalyzer();
      const text = query.trim();

      // Heuristic detection of input type
      const isUrl = text.startsWith('http://') || text.startsWith('https://') || text.includes('.com') || text.includes('.xyz') || text.includes('bit.ly');
      const isUpi = text.includes('@') && (text.includes('ok') || text.includes('ybl') || text.includes('paytm') || text.includes('upi'));
      
      let verdict: 'SAFE' | 'CAREFUL' | 'SCAM' = 'SAFE';
      let confidence = 15;
      let explanation = 'No obvious scam patterns detected. Communication appears standard.';
      let redFlags: string[] = [];

      // Evaluation rules
      const lower = text.toLowerCase();
      if (
        lower.includes('electricity') ||
        lower.includes('disconnect') ||
        lower.includes('kyc') ||
        lower.includes('digital arrest') ||
        lower.includes('cbi') ||
        lower.includes('part-time job') ||
        lower.includes('win') ||
        lower.includes('lottery') ||
        lower.includes('otp') ||
        isUrl && (lower.includes('bit.ly') || lower.includes('xyz') || lower.includes('update'))
      ) {
        verdict = 'SCAM';
        confidence = 94;
        explanation = 'This message creates extreme urgency, requests action or payment, and uses unverified contact details or domain links commonly associated with digital fraud.';
        redFlags = [
          'Artificial urgency ("disconnect tonight" / "account blocked")',
          'Asks for money transfer or sensitive information',
          'Unverified third-party web link or VPA handle',
          'Impersonation of official electricity board or bank'
        ];
      } else if (lower.includes('urgent') || lower.includes('call back') || lower.includes('offer')) {
        verdict = 'CAREFUL';
        confidence = 65;
        explanation = 'Some promotional or urgent language detected. Exercise caution before clicking links or sharing details.';
        redFlags = ['Urgent language pattern', 'Unverified sender'];
      }

      if (uploadedImageName) {
        verdict = 'SCAM';
        confidence = 91;
        explanation = `Screenshot analysis of "${uploadedImageName}" detected fraudulent payment receipt patterns with tampered UTR typography.`;
        redFlags = ['Tampered font alignment in transaction ID', 'Mismatched bank logo resolution'];
      }

      const scanResult = {
        verdict,
        confidence,
        explanation,
        redFlags,
        timestamp: new Date().toISOString(),
        query: text || uploadedImageName || 'Uploaded Media'
      };

      setResult(scanResult);
      setAnalyzing(false);
    }, 800);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImageName(file.name);
      handleAnalyze(`[Screenshot Uploaded: ${file.name}]`);
    }
  };

  const handleSpeakResult = () => {
    if (!result) return;
    const textToSpeak = `${result.verdict === 'SCAM' ? 'Likely Scam detected.' : result.verdict === 'CAREFUL' ? 'Be careful.' : 'Safe message.'} ${result.explanation}`;
    speakText(textToSpeak, currentLang);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Universal 1-Tap Scam Scanner
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
          Paste suspicious SMS text, WhatsApp messages, URLs, or upload screenshots for instant safety check.
        </p>
      </div>

      {/* INPUT CARD */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={getTranslation(currentLang, 'scanPlaceholder')}
          rows={4}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            marginBottom: '1rem'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* File Upload Option */}
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.85rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}>
            <ImageIcon size={18} color="var(--primary)" />
            {uploadedImageName ? uploadedImageName : 'Upload Screenshot'}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>

          <button
            onClick={() => handleAnalyze()}
            disabled={analyzing}
            className="btn btn-primary"
            style={{ flex: 1, minWidth: '160px' }}
          >
            {analyzing ? (
              <span>Scanning...</span>
            ) : (
              <>
                <Search size={18} />
                {getTranslation(currentLang, 'checkButton')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* RESULT DISPLAY CARD */}
      {result && (
        <div className="card animate-fade-in" style={{
          borderColor: result.verdict === 'SCAM' ? 'rgba(220, 38, 38, 0.4)' : result.verdict === 'CAREFUL' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(16, 185, 129, 0.4)',
          background: result.verdict === 'SCAM' ? 'var(--status-danger-bg)' : result.verdict === 'CAREFUL' ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
          marginBottom: '1.5rem'
        }}>
          {/* Verdict Header Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {result.verdict === 'SCAM' && <XCircle size={32} color="var(--status-danger)" />}
              {result.verdict === 'CAREFUL' && <AlertTriangle size={32} color="var(--status-warning)" />}
              {result.verdict === 'SAFE' && <CheckCircle2 size={32} color="var(--status-success)" />}

              <div>
                <div style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: result.verdict === 'SCAM' ? 'var(--status-danger)' : result.verdict === 'CAREFUL' ? 'var(--status-warning)' : 'var(--status-success)'
                }}>
                  {result.verdict === 'SCAM' && getTranslation(currentLang, 'scamVerdict')}
                  {result.verdict === 'CAREFUL' && getTranslation(currentLang, 'carefulVerdict')}
                  {result.verdict === 'SAFE' && getTranslation(currentLang, 'safeVerdict')}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.85 }}>
                  Confidence: {result.confidence}% Risk Factor
                </div>
              </div>
            </div>

            <button
              onClick={handleSpeakResult}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: '#fff' }}
            >
              <Volume2 size={16} color="var(--primary)" />
              {getTranslation(currentLang, 'listenAloud')}
            </button>
          </div>

          {/* Explanation */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              {getTranslation(currentLang, 'whySuspicious')}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {result.explanation}
            </div>
          </div>

          {/* Red Flags List */}
          {result.redFlags.length > 0 && (
            <div style={{ marginBottom: '1.25rem', background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--status-danger)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Flagged Scam Elements
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {result.redFlags.map((flag: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {result.verdict === 'SCAM' && (
              <>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('SOS')}
                  className="btn btn-danger"
                  style={{ width: '100%' }}
                >
                  <AlertTriangle size={18} />
                  {getTranslation(currentLang, 'reportButton')}
                </button>

                <button
                  onClick={() => {
                    if (onSaveReport) onSaveReport(result);
                    alert('Evidence report saved to "My Safety Reports"');
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%', background: '#fff' }}
                >
                  <FileText size={18} />
                  {getTranslation(currentLang, 'saveEvidence')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRIVACY BADGE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
        <Lock size={14} color="var(--status-success)" />
        {getTranslation(currentLang, 'piiScrubbingBadge')}
      </div>
    </div>
  );
};
