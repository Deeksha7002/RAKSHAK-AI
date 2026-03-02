import React, { useState } from 'react';
import { Terminal, Copy, Check, X, Info, ExternalLink, MessageSquare, Mail } from 'lucide-react';

export const IntegrationGuide: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Hardcode the production backend URL for clarity in the guide
    // If API_BASE_URL is relative, we assume the user is on the Vercel project
    const backendUrl = "https://scam-defender-honeypot-1.onrender.com";

    const integrations = [
        {
            id: 'sms',
            name: 'Twilio SMS Integration',
            icon: <MessageSquare size={18} className="text-blue-400" />,
            url: `${backendUrl}/api/webhook/twilio`,
            desc: 'Connect your Twilio number to catch SMS scammers.',
            steps: [
                'Log in to Twilio Console',
                'Go to Phone Numbers > Active Numbers',
                'Paste this URL into "A MESSAGE COMES IN" (Webhook)'
            ]
        },
        {
            id: 'email',
            name: 'Inbound Email (SendGrid)',
            icon: <Mail size={18} className="text-purple-400" />,
            url: `${backendUrl}/api/webhook/email`,
            desc: 'Route scam emails directly into Rakshak AI.',
            steps: [
                'Log in to SendGrid > Settings > Inbound Parse',
                'Add Host & Point to this Webhook URL',
                'All emails sent to your domain will be analyzed'
            ]
        }
    ];

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="floating-connect-btn"
                title="Connect Apps"
            >
                <Terminal size={20} />
                <span className="btn-label">CONNECT APPS</span>
            </button>
        );
    }

    return (
        <div className="floating-integration-box">
            <div className="integration-header">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-primary" />
                    <span className="font-bold text-sm tracking-wider">COMMAND CONSOLE: INTEGRATIONS</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="close-btn">
                    <X size={18} />
                </button>
            </div>

            <div className="integration-content">
                <div className="integration-alert">
                    <Info size={14} className="shrink-0" />
                    <span>Provide these Webhook URLs to your external apps to begin live interception.</span>
                </div>

                <div className="integration-list">
                    {integrations.map((app) => (
                        <div key={app.id} className="integration-card">
                            <div className="card-top">
                                <div className="flex items-center gap-2">
                                    {app.icon}
                                    <span className="app-name">{app.name}</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(app.url, app.id)}
                                    className={`copy-btn ${copied === app.id ? 'copied' : ''}`}
                                >
                                    {copied === app.id ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copied === app.id ? 'COPIED' : 'COPY WEBHOOK'}</span>
                                </button>
                            </div>

                            <div className="webhook-display">
                                {app.url}
                            </div>

                            <div className="steps-container">
                                {app.steps.map((step, i) => (
                                    <div key={i} className="step-item">
                                        <span className="step-num">{i + 1}</span>
                                        <span className="step-text">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="integration-footer">
                    <a href="https://github.com/Deeksha7002/Scam_defender_honeypot" target="_blank" rel="noreferrer" className="docs-link">
                        <ExternalLink size={14} /> VIEW FULL DOCUMENTATION
                    </a>
                </div>
            </div>

            <style>{`
                .floating-connect-btn {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    padding: 0.75rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    box-shadow: 0 4px 20px rgba(0, 135, 255, 0.4);
                    cursor: pointer;
                    z-index: 1000;
                    font-weight: bold;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .floating-connect-btn:hover {
                    transform: translateY(-4px) scale(1.05);
                    box-shadow: 0 8px 30px rgba(0, 135, 255, 0.6);
                    background: var(--primary-hover);
                }

                .floating-integration-box {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 380px;
                    background: #0f172a;
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    z-index: 1001;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideUp 0.3s ease-out;
                }

                .integration-header {
                    padding: 1rem;
                    background: #1e293b;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .integration-content {
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .integration-alert {
                    background: rgba(0, 135, 255, 0.1);
                    border: 1px solid rgba(0, 135, 255, 0.2);
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    display: flex;
                    gap: 0.75rem;
                    font-size: 0.75rem;
                    color: #bfdbfe;
                    line-height: 1.4;
                }

                .integration-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .integration-card {
                    background: #121b2e;
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    padding: 1rem;
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .app-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: white;
                }

                .webhook-display {
                    background: #000;
                    padding: 0.6rem;
                    border-radius: 4px;
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    color: #10b981;
                    word-break: break-all;
                    margin-bottom: 0.75rem;
                    border: 1px solid #1e293b;
                }

                .copy-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #94a3b8;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .copy-btn:hover {
                    background: #334155;
                    color: white;
                }

                .copy-btn.copied {
                    background: #059669;
                    border-color: #065f46;
                    color: white;
                }

                .steps-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }

                .step-item {
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                }

                .step-num {
                    background: var(--bg-active);
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 0.6rem;
                    font-weight: bold;
                    color: var(--primary);
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .step-text {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    line-height: 1.4;
                }

                .integration-footer {
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: center;
                }

                .docs-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-decoration: none;
                    font-weight: 600;
                }

                .docs-link:hover {
                    color: var(--primary);
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                }

                .close-btn:hover {
                    background: rgba(255,255,255,0.05);
                    color: white;
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @media (max-width: 480px) {
                    .floating-integration-box {
                        width: calc(100vw - 2rem);
                        bottom: 1rem;
                        right: 1rem;
                    }
                    .floating-connect-btn {
                        bottom: 1rem;
                        right: 1rem;
                    }
                    .btn-label {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};
