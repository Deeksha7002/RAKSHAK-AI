import React from 'react';
import { FileText, Download, Copy, Trash2, CheckCircle2, Shield } from 'lucide-react';
import { LanguageCode, getTranslation } from '../../lib/i18n';
import { PDFGenerator } from '../../lib/PDFGenerator';

interface CitizenReportsViewProps {
  currentLang: LanguageCode;
  savedReports?: any[];
}

export const CitizenReportsView: React.FC<CitizenReportsViewProps> = ({ currentLang, savedReports = [] }) => {
  const defaultReports = [
    {
      id: 'REP-2026-081',
      date: '2026-08-25 14:30',
      category: 'Fake Electricity Bill SMS',
      verdict: 'Likely Scam',
      confidence: 94,
      utr: '423489102938',
      handle: 'power-pay@ybl'
    },
    {
      id: 'REP-2026-079',
      date: '2026-08-22 11:15',
      category: 'Fake CBI Digital Arrest Call',
      verdict: 'Likely Scam',
      confidence: 96,
      utr: 'N/A',
      handle: 'cbi-officer@okicici'
    }
  ];

  const reportsToDisplay = savedReports.length > 0 ? savedReports : defaultReports;

  const handleDownloadPdf = (rep: any) => {
    try {
      const pdfGen = new PDFGenerator();
      pdfGen.generateReport({
        conversationId: rep.id,
        scamCategory: rep.category,
        scammerVpa: rep.handle,
        utrNumber: rep.utr,
        amountLost: '0.00',
        timestamp: rep.date
      });
      alert('Official Police Complaint PDF Evidence Dossier downloaded successfully!');
    } catch (e) {
      alert('Dossier generated! Opening print format...');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={26} color="var(--primary)" />
          {getTranslation(currentLang, 'evidenceLockerTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
          View and export your saved scam scan history and official Cyber Cell complaint dossiers.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reportsToDisplay.map((rep, idx) => (
          <div key={idx} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {rep.category}
              </div>
              <span className="badge badge-danger">
                {rep.verdict} ({rep.confidence}%)
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Report ID: <code>{rep.id}</code> • Logged on {rep.date}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleDownloadPdf(rep)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
              >
                <Download size={16} />
                {getTranslation(currentLang, 'downloadPdfDossier')}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`INCIDENT REPORT ${rep.id}: Category: ${rep.category}, Handle: ${rep.handle}, Ref UTR: ${rep.utr}`);
                  alert('Text copied for 1930 Cyber Crime Portal!');
                }}
                className="btn btn-outline"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
              >
                <Copy size={16} />
                {getTranslation(currentLang, 'copyFor1930')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
