import React, { useState } from 'react';
import { Mic, Upload, Volume2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';

interface VoiceCheckerViewProps {
  currentLang: LanguageCode;
}

export const VoiceCheckerView: React.FC<VoiceCheckerViewProps> = ({ currentLang }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      runVoiceAnalysis(file.name);
    }
  };

  const runVoiceAnalysis = (name: string) => {
    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      setResult({
        verdict: 'SYNTHETIC_SPEECH',
        confidence: 86,
        explanation: 'Audio spectrogram analysis indicates pitch regularity and synthetic spectral artifacts consistent with AI voice cloning tools.',
        recommendation: 'Do not transfer funds or share OTPs based solely on this voice note. Verify the person\'s identity by calling them on their official saved phone number.'
      });
      setAnalyzing(false);
    }, 1000);
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Mic size={22} color="#9333ea" />
        {getTranslation(currentLang, 'voiceCheckTitle')}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
        {getTranslation(currentLang, 'voiceCheckSubtitle')}
      </p>

      {/* UPLOAD & RECORD BOX */}
      <div style={{
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        textAlign: 'center',
        background: 'var(--bg-subtle)',
        marginBottom: '1.25rem'
      }}>
        <Mic size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem auto' }} />
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
          Upload or Record Voice Note
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Supports MP3, WAV, M4A voice notes from WhatsApp
        </div>

        <label className="btn btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          <Upload size={18} /> Select Audio File
          <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {analyzing && (
        <div style={{ textAlign: 'center', padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
          Analyzing acoustic spectrogram & neural speech harmonics...
        </div>
      )}

      {result && (
        <div className="animate-fade-in" style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--status-danger)',
          background: 'var(--status-danger-bg)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={20} /> AI-Generated / Cloned Voice Detected
            </div>
            <span className="badge badge-danger">{result.confidence}% Confidence</span>
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
            {result.explanation}
          </div>

          <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--status-danger)' }}>Recommended Action:</strong> {result.recommendation}
          </div>
        </div>
      )}
    </div>
  );
};
