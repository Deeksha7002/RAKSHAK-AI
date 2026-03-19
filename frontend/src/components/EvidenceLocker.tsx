import React, { useState } from 'react';
import { CreditCard, Link as LinkIcon, Database, Folder, FolderOpen, AlertTriangle, Search, Send, CheckCircle, Loader2, FileDown, Code, Lock, Shield } from 'lucide-react';
import { soundManager } from '../lib/SoundManager';
import { PDFGenerator } from '../lib/PDFGenerator';
import { CyberCellService } from '../lib/CyberCellService';
import { CryptoUtils } from '../lib/CryptoUtils';
import type { CaseFile } from '../lib/types';

interface EvidenceLockerProps {
    cases: CaseFile[];
    onClose: () => void;
}

export const EvidenceLocker: React.FC<EvidenceLockerProps> = ({ cases, onClose }) => {
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases.length > 0 ? cases[0].id : null);

    // Auto-select first case if none selected and cases become available
    React.useEffect(() => {
        if (!selectedCaseId && cases.length > 0) {
            setSelectedCaseId(cases[0].id);
        }
    }, [cases, selectedCaseId]);

    // Play sound on open
    React.useEffect(() => {
        soundManager.playLockerOpen();
    }, []);

    const selectedCase = cases.find(c => c.id === selectedCaseId);

    const [reportStatus, setReportStatus] = useState<'idle' | 'encrypting' | 'sent'>('idle');
    const [showLog, setShowLog] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<'idle' | 'checking' | 'verified' | 'tampered'>('idle');

    const verifyIntegrity = async () => {
        if (!selectedCase || !selectedCase.signature) return;
        
        setIntegrityStatus('checking');
        // Visual delay for "forensic analysis" feel
        await new Promise(r => setTimeout(r, 1200));

        // Re-generate signature from current data
        // For our implementation, we'll sign the core fields: result (if forensic) or transcript
        const dataToVerify = selectedCase.forensicResult ? {
            result: selectedCase.forensicResult,
            timestamp: new Date(selectedCase.timestamp).getTime(), // This is a bit tricky if timestamps mismatch
            origin: 'RAKSHAK-FORENSICS-LAB'
        } : {
            transcript: selectedCase.transcript,
            iocs: selectedCase.iocs
        };

        // For now, if it's already "Sealed", we trust the backend's signature field
        // A real implementation would re-hash everything. Here we simulate the logic.
        const isValid = await CryptoUtils.verifySignature(dataToVerify, selectedCase.signature);
        const isFine = selectedCase.isSealed && isValid;
        
        setIntegrityStatus(isFine ? 'verified' : 'tampered');
        if (isFine) soundManager.playSuccess();
        else soundManager.playScanError();
    };

    const handleReport = async () => {
        if (!selectedCase) return;

        setReportStatus('encrypting');
        
        try {
            // Map CaseFile to IncidentReport for the service
            const reportData = {
                conversationId: selectedCase.id,
                scammerName: selectedCase.scammerName,
                platform: selectedCase.platform,
                classification: selectedCase.threatLevel,
                confidenceScore: selectedCase.threatLevel === 'scam' ? 0.98 : 0.85,
                iocs: selectedCase.iocs,
                transcript: selectedCase.transcript,
                timestamp: new Date().toISOString(),
                detectedLocation: selectedCase.detectedLocation,
                scamType: 'OTHER' as any // Initial type, backend can refine
            };

            const success = await CyberCellService.reportScam(reportData);
            
            if (success) {
                setReportStatus('sent');
                soundManager.playSuccess();
                console.log("✅ TRANSMISSION COMPLETE. Evidence delivered to CyberSec.");
            } else {
                throw new Error('Transmission failed');
            }
        } catch (error) {
            console.error("Manual report failed:", error);
            setReportStatus('idle');
            // We could show an error toast here if one existed
        }
    };

    // Reset reporting status when case changes
    React.useEffect(() => {
        setReportStatus('idle');
    }, [selectedCaseId]);

    // Helper to render a section
    const renderSection = (title: string, icon: React.ReactNode, items: string[], emptyMsg: string) => (
        <div className="locker-section">
            <div className="locker-section-header">
                <div className="locker-icon-wrapper">
                    {icon}
                </div>
                <h3 className="locker-section-title">{title}</h3>
                <span className="locker-counter">
                    {items.length} ITMS
                </span>
            </div>

            {items.length === 0 ? (
                <div className="locker-empty-msg">{emptyMsg}</div>
            ) : (
                <div className="locker-grid">
                    {items.map((item, idx) => (
                        <div key={idx} className="locker-item group">
                            <span className="locker-item-text">{item}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(item)}
                                className="locker-copy-btn"
                            >
                                Copy
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="locker-overlay">
            <div className="locker-modal">
                {/* Sidebar - Case List */}
                <div className="locker-sidebar">
                    <div className="locker-sidebar-header">
                        <Database size={20} className="text-white" />
                        <span className="locker-branding">CASE FILES</span>
                    </div>

                    <div className="locker-case-list">
                        {cases.length === 0 && (
                            <div className="locker-empty-sidebar">No active cases.</div>
                        )}
                        {cases.map(c => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCaseId(c.id)}
                                className={`locker-case-item ${selectedCaseId === c.id ? 'active' : ''}`}
                            >
                                <div className="locker-case-row">
                                    {selectedCaseId === c.id ? <FolderOpen size={18} /> : <Folder size={18} />}
                                    <div className="locker-case-info">
                                        <div className="locker-case-name">{c.scammerName}</div>
                                        <div className="locker-case-meta">
                                            {c.platform} • {c.status}
                                            {c.autoReported && <span style={{ color: '#4ade80', marginLeft: '8px' }}>• Reported</span>}
                                        </div>
                                    </div>
                                    {c.threatLevel === 'scam' && <div className="locker-threat-dot"></div>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="locker-sidebar-footer">
                        <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--status-danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                            CLOSE SYSTEM
                        </button>
                    </div>
                </div>

                {/* Main Content - Case Details */}
                <div className="locker-detail-pane">
                    {selectedCase ? (
                        <>
                            {/* Case Header */}
                            <div className="locker-detail-header">
                                <div className="locker-header-left">
                                    <h2 className="locker-case-title">
                                        {selectedCase.scammerName}
                                        <span className="locker-case-id">#{selectedCase.id}</span>
                                    </h2>
                                    <div className="locker-meta-row">
                                        <span className="locker-meta-tag">
                                            {selectedCase.isSealed ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem' }}>
                                                    <Lock size={12} /> SEALED EVIDENCE
                                                </span>
                                            ) : (
                                                <span style={{ color: '#64748b' }}>UNSEALED</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <div className="locker-header-right">
                                    <div className="flex gap-2 mb-2">
                                        {selectedCase.isSealed && (
                                            <button
                                                onClick={verifyIntegrity}
                                                disabled={integrityStatus === 'checking'}
                                                className={`locker-action-btn ${integrityStatus}`}
                                                style={{ 
                                                    width: 'auto', 
                                                    padding: '0 12px', 
                                                    fontSize: '0.7rem',
                                                    borderColor: integrityStatus === 'verified' ? '#10b981' : integrityStatus === 'tampered' ? '#ef4444' : 'rgba(59,130,246,0.3)',
                                                    color: integrityStatus === 'verified' ? '#10b981' : integrityStatus === 'tampered' ? '#ef4444' : '#93c5fd'
                                                }}
                                            >
                                                {integrityStatus === 'checking' ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : integrityStatus === 'verified' ? (
                                                    <CheckCircle size={14} />
                                                ) : integrityStatus === 'tampered' ? (
                                                    <AlertTriangle size={14} />
                                                ) : (
                                                    <Shield size={14} />
                                                )}
                                                <span style={{ marginLeft: '6px' }}>
                                                    {integrityStatus === 'checking' ? 'VERIFYING...' : 
                                                     integrityStatus === 'verified' ? 'AUTHENTICITY VERIFIED' : 
                                                     integrityStatus === 'tampered' ? 'TAMPERED DETECTED' : 
                                                     'VERIFY INTEGRITY'}
                                                </span>
                                            </button>
                                        )}
                                        <button
                                            title="Export PDF Report"
                                            onClick={() => PDFGenerator.generateCaseReport(selectedCase, selectedCase.transcript)}
                                            className="locker-action-btn"
                                        >
                                            <FileDown size={18} />
                                        </button>
                                        <button
                                            title="Export Raw JSON"
                                            onClick={() => PDFGenerator.downloadJSON(selectedCase, selectedCase.transcript)}
                                            className="locker-action-btn"
                                        >
                                            <Code size={18} />
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            className={`locker-report-btn ${reportStatus}`}
                                            onClick={handleReport}
                                            disabled={reportStatus !== 'idle'}
                                        >
                                            {reportStatus === 'idle' && (
                                                <>
                                                    <Send size={16} /> Report to CyberSec
                                                </>
                                            )}
                                            {reportStatus === 'encrypting' && (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" /> Encrypting...
                                                </>
                                            )}
                                            {reportStatus === 'sent' && (
                                                <>
                                                    <CheckCircle size={16} /> Securely Sent
                                                </>
                                            )}
                                        </button>
                                        {reportStatus === 'sent' && (
                                            <button
                                                onClick={() => setShowLog(!showLog)}
                                                className="locker-log-link"
                                                style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', marginTop: '0.5rem' }}
                                            >
                                                {showLog ? 'Hide Payload' : 'View Transmission Log'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* View Log Overlay */}
                            {showLog && (
                                <div style={{
                                    background: '#0f172a',
                                    color: '#cbd5e1',
                                    padding: '1rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    overflow: 'auto',
                                    borderBottom: '1px solid #334155',
                                    maxHeight: '200px',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                }}>
                                    <pre>{JSON.stringify(selectedCase, null, 2)}</pre>
                                </div>
                            )}



                            {/* Evidence Grid */}
                            <div className="locker-detail-grid">
                                {renderSection(
                                    "Financial Assets",
                                    <CreditCard size={18} />,
                                    [...new Set(selectedCase.iocs.paymentMethods)],
                                    "No bank/crypto details intercepted."
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {renderSection(
                                        "Digital Footprint",
                                        <LinkIcon size={18} />,
                                        [...new Set(selectedCase.iocs.urls)],
                                        "No malicious links captured."
                                    )}
                                    {renderSection(
                                        "Domains",
                                        <Database size={18} />,
                                        [...new Set(selectedCase.iocs.domains)],
                                        "No domains identified."
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="locker-no-selection" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Select a case file to view evidence.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
