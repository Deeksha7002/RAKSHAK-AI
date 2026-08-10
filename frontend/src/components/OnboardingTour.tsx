import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Shield, Target, Map as MapIcon, BarChart3, ScanEye, Database, Zap, Sparkles, ShieldAlert } from 'lucide-react';
import { soundManager } from '../lib/SoundManager';

interface TourStep {
    id: string;
    title: string;
    content: string;
    icon: React.ReactNode;
    view?: 'DASHBOARD' | 'LOCKER' | 'FORENSICS' | 'INTELLIGENCE' | 'DEMO' | 'HONEY_TOKENS' | 'COMMAND';
    selector?: string; // For future spotlight implementation
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Rakshak AI',
        content: 'Your friendly guide against social engineering and digital fraud. Let’s take a quick tour of your safety tools.',
        icon: <Shield size={32} color="var(--primary)" />
    },
    {
        id: 'dashboard',
        title: 'Protection Dashboard',
        content: 'View the overall safety status of your accounts and devices at a glance.',
        icon: <Zap size={32} color="#fbbf24" />,
        view: 'DASHBOARD'
    },
    {
        id: 'threat-map',
        title: 'Safety Activity Map',
        content: 'See where incoming scam attempts were detected and trace their source locations.',
        icon: <MapIcon size={32} color="#10b981" />,
        view: 'DASHBOARD'
    },
    {
        id: 'honey-tokens',
        title: 'Honey Tokens',
        content: 'Generate safe, tracked files or links to send to suspected scammers, helping to identify their general location.',
        icon: <Target size={32} color="#ef4444" />,
        view: 'HONEY_TOKENS'
    },
    {
        id: 'intelligence',
        title: 'Threat Analysis',
        content: 'Review automated security trends and identify common pattern profiles of fraud attempts.',
        icon: <BarChart3 size={32} color="#8b5cf6" />,
        view: 'INTELLIGENCE'
    },
    {
        id: 'forensics',
        title: 'Media Verification',
        content: 'Upload suspicious images, audio, or video files to verify if they have been generated or modified by AI.',
        icon: <ScanEye size={32} color="#3b82f6" />,
        view: 'FORENSICS'
    },
    {
        id: 'locker',
        title: 'Evidence Locker',
        content: 'Review details of caught scams and safely download reports to share with authority bodies.',
        icon: <Database size={32} color="#ec4899" />,
        view: 'LOCKER'
    },
    {
        id: 'emergency-nuke',
        title: 'Emergency Data Reset',
        content: 'Reset all volatile session data and log out in one click if you ever need to clear your active workspaces.',
        icon: <ShieldAlert size={32} color="#ef4444" />,
        view: 'COMMAND'
    }
];

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchView: (view: any) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onSwitchView }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const step = TOUR_STEPS[currentStep];

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            const nextView = TOUR_STEPS[nextStep].view;
            if (nextView) onSwitchView(nextView);
            soundManager.playSuccess();
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            const prevView = TOUR_STEPS[prevStep].view;
            if (prevView) onSwitchView(prevView);
            soundManager.playSuccess();
        }
    };

    return (
        <div className="tour-overlay" style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="sys-card tour-modal" style={{
                maxWidth: '450px', width: '100%', position: 'relative',
                padding: '2.5rem', background: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))',
                border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'modalEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <button 
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '50%',
                        boxShadow: '0 0 30px rgba(var(--primary-rgb), 0.2)',
                        animation: 'pulseGlow 2s infinite'
                    }}>
                        {step.icon}
                    </div>

                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '2px', color: '#fff', margin: '0 0 0.5rem 0' }}>
                            {step.title}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '1rem' }}>
                            {TOUR_STEPS.map((_, i) => (
                                <div key={i} style={{ 
                                    width: i === currentStep ? '20px' : '6px', height: '6px', 
                                    background: i === currentStep ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                                    borderRadius: '10px', transition: 'all 0.3s ease'
                                }} />
                            ))}
                        </div>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem', margin: 0 }}>
                            {step.content}
                        </p>
                    </div>

                    <div style={{ display: 'flex', width: '100%', gap: '1rem', marginTop: '1rem' }}>
                        {currentStep > 0 ? (
                            <button
                                onClick={handleBack}
                                style={{ 
                                    flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer'
                                }}
                            >
                                <ChevronLeft size={18} /> BACK
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                style={{ 
                                    flex: 1, padding: '12px', background: 'transparent',
                                    border: '1px solid transparent', color: '#64748b', cursor: 'pointer'
                                }}
                            >
                                SKIP
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            style={{ 
                                flex: 2, padding: '12px', background: 'var(--primary)',
                                border: 'none', color: '#111', borderRadius: '8px', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.3)'
                            }}
                        >
                            {currentStep === TOUR_STEPS.length - 1 ? 'GET STARTED' : 'CONTINUE'} 
                            {currentStep === TOUR_STEPS.length - 1 ? <Sparkles size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalEntrance {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.1); }
                    50% { box-shadow: 0 0 40px rgba(var(--primary-rgb), 0.3); }
                    100% { box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.1); }
                }
            `}</style>
        </div>
    );
};
