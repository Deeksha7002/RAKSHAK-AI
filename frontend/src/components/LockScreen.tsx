import React, { useState } from 'react';
import { ShieldCheck, Lock, Fingerprint, ChevronRight, AlertCircle } from 'lucide-react';

interface LockScreenProps {
    onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'granted'>('idle');
    const [progress, setProgress] = useState(0);

    const handleAccess = () => {
        setStatus('scanning');
        // Simulate biometric scan / connection
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 15;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setStatus('granted');
                setTimeout(onUnlock, 800);
            }
            setProgress(p);
        }, 150);
    };

    return (
        <div className="lock-screen">
            <div className="lock-container">
                <div className="lock-header">
                    <div className="lock-icon-circle">
                        <Lock size={32} className={status === 'granted' ? 'text-green' : 'text-primary'} />
                    </div>
                    <h1>Secure Access</h1>
                    <p>Unlock to view your dashboard</p>
                </div>

                <div className="lock-body">
                    {status === 'idle' && (
                        <button onClick={handleAccess} className="auth-btn">
                            <Fingerprint size={24} />
                            <span>Unlock Account</span>
                            <ChevronRight size={18} className="arrow" />
                        </button>
                    )}

                    {status === 'scanning' && (
                        <div className="scanning-ui">
                            <div className="scan-text">Verifying...</div>
                            <div className="scan-bar-bg">
                                <div className="scan-bar-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="scan-details">
                                <span>Encryption: Secure</span>
                                <span>Status: Active</span>
                            </div>
                        </div>
                    )}

                    {status === 'granted' && (
                        <div className="access-granted">
                            <ShieldCheck size={48} className="text-green animate-bounce-subtle" />
                            <div className="granted-text">UNLOCKED</div>
                            <div className="granted-sub">Opening Dashboard...</div>
                        </div>
                    )}
                </div>

                <div className="lock-footer">
                    <div className="footer-item">
                        <ShieldCheck size={14} /> Protected Space
                    </div>
                    <div className="footer-item">
                        <AlertCircle size={14} /> Security check active
                    </div>
                </div>
            </div>

            {/* Background decorative elements */}
            <div className="bg-grid-overlay"></div>
        </div>
    );
};
