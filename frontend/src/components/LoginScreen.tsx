import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, EyeOff, Eye, AlertTriangle, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, DEMO_ACCESS_KEY } from '../lib/config';
import { SecurityProtocolModal } from './SecurityProtocolModal';
import '../index.css';

/*
interface LoginScreenProps {
    onLogin?: (username: string) => void;
}
*/

// â”€â”€ WebAuthn base64url helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function base64urlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    return buffer.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Converts challenge/id fields in options from base64url strings â†’ ArrayBuffers
/*
function prepareRegistrationOptions(options: any): PublicKeyCredentialCreationOptions {
    // ... code omitted
}
*/

function prepareAuthenticationOptions(options: any): PublicKeyCredentialRequestOptions {
    return {
        ...options,
        challenge: base64urlToBuffer(options.challenge),
        allowCredentials: (options.allowCredentials || []).map((c: any) => ({
            ...c,
            id: base64urlToBuffer(c.id),
        })),
    };
}

// â”€â”€ Enroll biometrics for a newly-registered user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/*
async function enrollBiometrics(username: string): Promise<void> {
    // ... code omitted for brevity but commented out in file
}
*/
// â”€â”€ Matrix Digital Rain Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MatrixRain: React.FC = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const CHARS = '01ã‚¢ã‚¤ã‚¦ã‚¨ã‚ªã‚«ã‚­ã‚¯ã‚±ã‚³ã‚µã‚·ã‚¹ã‚»ã‚½ã‚¿ãƒãƒ„ãƒ†ãƒˆãƒŠãƒ‹ãƒŒãƒãƒŽ';
        const FONT_SIZE = 14;
        let cols = Math.floor(canvas.width / FONT_SIZE);
        const drops: number[] = Array(cols).fill(1);

        let animId: number;
        const draw = () => {
            cols = Math.floor(canvas.width / FONT_SIZE);
            // Fade trail
            ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < drops.length; i++) {
                const char = CHARS[Math.floor(Math.random() * CHARS.length)];
                // Brighter head, dimmer trail
                const brightness = Math.random() > 0.02 ? 0.45 : 1;
                ctx.fillStyle = `rgba(16, 185, 129, ${brightness})`;
                ctx.font = `${FONT_SIZE}px monospace`;
                ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);

                if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            animId = requestAnimationFrame(draw);
        };
        animId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.7,
            }}
        />
    );
};

export const LoginScreen: React.FC<any> = () => {
    const { login, register } = useAuth();

    const lastUser = localStorage.getItem('scam_last_user');
    const hasRegistered = localStorage.getItem('scam_registered');

    type Mode = 'register' | 'returning';
    const getInitialMode = (): Mode => {
        if (!hasRegistered) return 'register';
        return 'returning';
    };

    const [mode, setMode] = useState<Mode>(getInitialMode);
    const [username, setUsername] = useState(lastUser || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    // Phase tracking for registration: 'form' → account created → 'biometric'
    const [regPhase, setRegPhase] = useState<'form' | 'biometric'>('form');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [isProtocolOpen, setIsProtocolOpen] = useState(false);

    // ── Biometric auto-trigger on arrival (PhonePe style) ──────────────────
    useEffect(() => {
        const attemptTrigger = () => {
            if (mode === 'returning' && username && window.PublicKeyCredential && !isLoading) {
                // Ensure we use the trimmed version for the handshake
                const userToScan = username.trim();
                console.log("[RAKSHAK] Auto-Trigger Attempting for:", userToScan);
                triggerBiometric(userToScan);
            }
        };

        // Try on mount
        const timer = setTimeout(attemptTrigger, 1000);

        // Re-trigger if the user leaves and comes back to the tab
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                console.log("[RAKSHAK] Tab Focused - Re-trying Biometric Handshake");
                attemptTrigger();
            }
        };
        window.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('visibilitychange', handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, username]);

    const triggerBiometric = async (rawUser: string) => {
        setIsLoading(true);
        setError(null);
        setStatusMsg('SCANNING BIOMETRICS...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for cold starts

        const user = rawUser.trim().toLowerCase();
        // FIX: Added 'cb' (cache buster) to bypass stubborn browser/PWA caches.
        const fetchUrl = `${API_BASE_URL}/api/biometric/login/start?username=${encodeURIComponent(user)}&cb=${Date.now()}`;
        try {
            console.log(`[RAKSHAK] Login Start | URL: ${fetchUrl} | Base: ${API_BASE_URL || 'RELATIVE'}`);
            const startRes = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            if (!startRes.ok) {
                const errData = await startRes.json().catch(() => ({}));
                throw new Error(errData.detail || `Server rejected request (${startRes.status})`);
            }
            const rawOptions = await startRes.json();
            const requestOptions = prepareAuthenticationOptions(rawOptions);

            setStatusMsg('VERIFY IDENTITY...');
            const assertion = await navigator.credentials.get({ publicKey: requestOptions }) as PublicKeyCredential;
            if (!assertion) throw new Error('no_assertion');

            const assResponse = assertion.response as AuthenticatorAssertionResponse;
            setStatusMsg('AUTHORIZING ACCESS...');

            const finishUrl = `${API_BASE_URL}/api/biometric/login/finish?username=${encodeURIComponent(user)}`;
            console.log(`[RAKSHAK] Login Finish | URL: ${finishUrl}`);
            const finishRes = await fetch(finishUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: assertion.id,
                    rawId: bufferToBase64url(assertion.rawId),
                    type: assertion.type,
                    response: {
                        clientDataJSON: bufferToBase64url(assResponse.clientDataJSON),
                        authenticatorData: bufferToBase64url(assResponse.authenticatorData),
                        signature: bufferToBase64url(assResponse.signature),
                        userHandle: assResponse.userHandle ? bufferToBase64url(assResponse.userHandle) : null,
                    },
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await finishRes.json();

            if (finishRes.ok && data.token) {
                setStatusMsg('ACCESS GRANTED');
                localStorage.setItem('rakshak_access_token', data.token);
                localStorage.setItem('scam_last_user', user);
                // Set session BEFORE reload so AuthProvider knows user is authenticated
                sessionStorage.setItem('active_session', JSON.stringify({ id: user, username: user }));
                window.location.reload();
            } else {
                throw new Error(data.detail || 'verification_failed');
            }
        } catch (e: any) {
            clearTimeout(timeoutId);
            setStatusMsg(null);

            const msg = e.message || "Unknown error";
            const lowMsg = msg.toLowerCase();

            // DEFINITIVE ERROR VISIBILITY: Always show the detail if it's a server rejection
            if (lowMsg.includes('no biometric credentials') || lowMsg.includes('not enrolled')) {
                setError('BIOMETRIC NOT ENROLLED FOR THIS ACCOUNT. USE ACCESS CODE.');
            } else if (lowMsg.includes('user not found')) {
                setError(`OPERATOR ID "${user}" NOT FOUND. CHECK SPELLING.`);
            } else if (lowMsg.includes('fetch') || lowMsg.includes('network') || lowMsg.includes('failed to fetch')) {
                console.error("[RAKSHAK] CORE UNREACHABLE:", fetchUrl);
                setError('CORE OFFLINE - CHECK NETWORK OR USE ACCESS CODE');
            } else if (lowMsg.includes('no_assertion') || lowMsg.includes('cancel') || lowMsg.includes('notallowederror') || lowMsg.includes('not allowed') || lowMsg.includes('timed out')) {
                console.log("[RAKSHAK] Biometric Prompt Cancelled or Timed Out");
                setError('BIOMETRIC AUTHENTICATION CANCELLED OR TIMED OUT. PLEASE RETRY OR USE ACCESS CODE.');
            }
 else {
                console.error("[RAKSHAK] Auth Critical Failure:", msg);
                setError(`SECURE CORE REJECTION: ${msg.toUpperCase()}`);
            }
        }
        finally {
            setIsLoading(false);
        }
    };

    // ── Registration submit ─────────────────────────────────────────────────
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMsg(null);
        if (!username.trim() || !password.trim()) { 
            setError('ALL FIELDS REQUIRED'); 
            return; 
        }

        console.log(`[RAKSHAK] Registration Start: "${username.trim()}"`);
        if (password !== confirmPassword) { setError('PASSWORDS DO NOT MATCH'); return; }

        setIsLoading(true);
        try {
            // Step 1: Create account on backend
            const success = await register(username, password, DEMO_ACCESS_KEY);
            if (!success) throw new Error('BACKEND REJECTED REGISTRATION');

            console.log(`[RAKSHAK] Account Created. Transitioning to Biometric Phase.`);

            // Critical State Persistence for the Biometric Handshake
            const cleanUser = username.trim().toLowerCase();
            localStorage.setItem('scam_registered', 'true');
            localStorage.setItem('scam_last_user', cleanUser);

            setRegUsername(cleanUser);
            setRegPassword(password);

            // Switch Phase IMMEDIATELY
            setRegPhase('biometric');
            setStatusMsg('✓ ACCOUNT ESTABLISHED — PLEASE INITIALIZE BIOMETRIC ENROLLMENT');

        } catch (e: any) {
            console.error(`[RAKSHAK] Registration Error:`, e);
            setError(e.message || 'REGISTRATION FAILED — TRY AGAIN');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Biometric enroll (separate user gesture after account creation) ──────
    // Pre-flight ping to wake up a sleeping Render instance before biometric call
    const wakeBackend = async (): Promise<boolean> => {
        setStatusMsg('CONNECTING TO RAKSHAK CORE...');
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                const res = await fetch(`${API_BASE_URL}/api/ping`, { method: 'GET', signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok || res.status === 404) return true; // 404 = server is awake, just route doesn't exist
            } catch (e) {
                console.warn(`[RAKSHAK] Wake attempt ${attempt}/3 failed`);
                if (attempt < 3) setStatusMsg(`WAKING RAKSHAK CORE... (${attempt}/3)`);
            }
            if (attempt < 3) await new Promise(r => setTimeout(r, 3000));
        }
        return false;
    };

    const enrollBiometrics = async (rawUser: string) => {
        setIsLoading(true);
        setError(null);
        setStatusMsg('INITIALIZING BIOMETRIC PROTOCOL...');

        // Wake up Render before the critical biometric call
        const backendAwake = await wakeBackend();
        if (!backendAwake) {
            setError('NETWORK ERROR: Could not connect to Rakshak AI Core. Check your internet or try later.');
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for cold starts

        const user = rawUser.trim().toLowerCase();
        const fetchUrl = `${API_BASE_URL}/api/biometric/register/start?username=${encodeURIComponent(user)}`;
        try {
            console.log(`[RAKSHAK] Enroll Start | URL: ${fetchUrl}`);
            const startRes = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            if (!startRes.ok) {
                const errData = await startRes.json().catch(() => ({}));
                throw new Error(errData.detail || `Server rejected request (${startRes.status})`);
            }
            const options = await startRes.json();

            // Convert challenge and user.id from base64url strings -> ArrayBuffers
            const creationOptions: PublicKeyCredentialCreationOptions = {
                ...options,
                challenge: base64urlToBuffer(options.challenge),
                user: {
                    ...options.user,
                    id: base64urlToBuffer(options.user.id)
                },
                excludeCredentials: (options.excludeCredentials || []).map((c: any) => ({
                    ...c,
                    id: base64urlToBuffer(c.id)
                }))
            };

            const credential = await navigator.credentials.create({ publicKey: creationOptions }) as PublicKeyCredential;
            if (!credential) throw new Error('no_credential');

            const attResponse = credential.response as AuthenticatorAttestationResponse;
            setStatusMsg('VERIFYING BIOMETRIC PAYLOAD...');

            const finishRes = await fetch(
                `${API_BASE_URL}/api/biometric/register/finish?username=${encodeURIComponent(user)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Rakshak-Token': 'rakshak-core-v1'
                    },
                    body: JSON.stringify({
                        id: credential.id,
                        rawId: bufferToBase64url(credential.rawId),
                        type: credential.type,
                        response: {
                            clientDataJSON: bufferToBase64url(attResponse.clientDataJSON),
                            attestationObject: bufferToBase64url(attResponse.attestationObject),
                        },
                    }),
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);

            if (finishRes.ok) {
                setStatusMsg('BIOMETRICS ENROLLED!');
                if (regPassword) {
                    setStatusMsg('ENROLLED! Auto-logging you in...');
                    const success = await login(user, regPassword);
                    if (!success) setStatusMsg('ENROLLED! Please log in manually with your access code.');
                } else {
                    setStatusMsg('ENROLLED! Please log in manually using your access code.');
                    setTimeout(() => setMode('returning'), 3000);
                }
            } else {
                const data = await finishRes.json().catch(() => ({ detail: 'verification failed' }));
                throw new Error(data.detail || 'biometric verification failed');
            }
        } catch (e: any) {
            clearTimeout(timeoutId);
            console.error("Biometric enrollment failed:", e);
            if (e.name === 'AbortError') {
                setError('CONNECTION TIMEOUT: Backend is slow or unreachable. Please try again.');
            } else if (e.message.includes('fetch')) {
                setError('NETWORK ERROR: Could not connect to Rakshak AI Core. Check your internet or try later.');
            } else {
                setStatusMsg(null);
                setError(`SETUP FAILED: ${e.message || 'unknown error'} - USE MANUAL LOGIN`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnrollBiometrics = async () => {
        if (!regUsername) {
            setError('SESSION EXPIRED — PLEASE LOG IN MANUALLY');
            return;
        }
        await enrollBiometrics(regUsername);
    };

    // ── Password login submit ───────────────────────────────────────────────
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMsg(null);
        setError(null);
        if (!username.trim() || !password.trim()) { setError('CREDENTIALS REQUIRED'); return; }
        console.log(`[Login] Attempting for: "${username.trim()}"`);
        setIsLoading(true);
        try {
            const success = await login(username, password);
            if (!success) {
                setError('ACCESS DENIED: INVALID CREDENTIALS');
            } else {
                localStorage.setItem('scam_last_user', username);
                window.location.reload();
            }
        } catch {
            setError('SYSTEM ERROR — TRY AGAIN');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Shared card wrapper ─────────────────────────────────────────────────
    const cardStyle: React.CSSProperties = {
        width: '400px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        padding: '2.5rem',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '16px',
        boxShadow: '0 0 60px rgba(16, 185, 129, 0.08)',
        position: 'relative', zIndex: 10,
        backdropFilter: 'blur(12px)',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 12px 12px 40px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', color: '#fff', fontFamily: 'Inter, sans-serif',
        outline: 'none', fontSize: '0.9rem',
    };
    const btnPrimary: React.CSSProperties = {
        width: '100%', padding: '13px', background: '#10b981', color: '#000',
        border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', fontSize: '0.9rem', marginTop: '0.5rem',
    };
    const btnGhost: React.CSSProperties = {
        width: '100%', padding: '10px', background: 'none',
        border: '1px solid rgba(16,185,129,0.35)', color: '#10b981',
        borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
        fontSize: '0.8rem', marginTop: '0.75rem', letterSpacing: '0.5px',
    };

    const Header = ({ subtitle }: { subtitle: string }) => (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '80px', height: '80px', borderRadius: '12px',
                background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
                marginBottom: '1rem', overflow: 'hidden', padding: '10px'
            }}>
                <img src="/favicon.png" alt="Rakshak AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                RAKSHAK<span style={{ color: '#10b981' }}>-AI</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', letterSpacing: '1px' }}>
                {subtitle}
            </p>
        </div>
    );

    const StatusBar = () => {
        const isNotEnrolled = error && error.includes('NOT ENROLLED');

        return (
            <>
                {statusMsg && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <ShieldCheck size={16} /> {statusMsg}
                    </div>
                )}
                {error && !isNotEnrolled && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}

                {/* ── PREMIUM ONBOARDING ────────────────────────────────────────── */}
                {isNotEnrolled && (
                    <div style={{
                        background: 'rgba(6,182,212,0.08)',
                        border: '1px solid rgba(6,182,212,0.3)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        textAlign: 'left',
                        animation: 'glow 2s infinite alternate'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', background: 'rgba(6,182,212,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Fingerprint size={18} color="#22d3ee" />
                            </div>
                            <span style={{ color: '#22d3ee', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>SECURE PROTOCOL SETUP</span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: 1.4, marginBottom: '1rem' }}>
                            Hardware sync required for <span style={{ color: '#fff', fontWeight: 700 }}>{username}</span>. Enable biometric recognition to unlock seamless passwordless access.
                        </p>
                        <button
                            type="button"
                            onClick={() => enrollBiometrics(username)}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'rgba(6,182,212,0.2)',
                                border: '1px solid rgba(6,182,212,0.5)',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(6,182,212,0.4)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(6,182,212,0.2)')}
                        >
                            <ShieldCheck size={14} /> ACTIVATE BIOMETRICS
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#e0e0e0', fontFamily: 'monospace', position: 'relative', overflowY: 'auto', paddingTop: '2rem', paddingBottom: '2rem' }}>
            <MatrixRain />

            {/* ── MODE: REGISTER (PHASE: FORM) ── */}
            {mode === 'register' && regPhase === 'form' && (
                <div key="reg-form" style={cardStyle}>
                    <Header subtitle="NEW OPERATOR ENROLLMENT" />

                    <form onSubmit={handleRegister}>

                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CREATE OPERATOR ID</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => { setUsername(e.target.value); setError(null); setStatusMsg(null); }}
                                    style={inputStyle}
                                    placeholder="Choose a username..."
                                />
                                <Fingerprint size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CREATE ACCESS CODE</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(null); setStatusMsg(null); }}
                                    style={{ ...inputStyle, paddingRight: 40 }}
                                    placeholder="••••••••"
                                />
                                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CONFIRM ACCESS CODE</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setError(null); setStatusMsg(null); }}
                                    style={inputStyle}
                                    placeholder="••••••••"
                                />
                                <ShieldCheck size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                            </div>
                        </div>

                        <StatusBar />

                        <button type="submit" disabled={isLoading} style={{ ...btnPrimary, background: isLoading ? '#334155' : '#10b981', color: isLoading ? '#94a3b8' : '#000', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                            {isLoading ? <span>ESTABLISHING ACCOUNT...</span> : <><UserPlus size={18} /><span>CREATE NEW ACCOUNT</span></>}
                        </button>
                    </form>

                    {!isLoading && (
                        <button type="button" onClick={() => { localStorage.setItem('scam_registered', 'true'); setMode('returning'); }} style={{ ...btnGhost, color: '#475569', border: '1px solid rgba(71,85,105,0.25)', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                            USE EXISTING ACCOUNT
                        </button>
                    )}
                </div>
            )}

            {/* ── MODE: REGISTER (PHASE: BIOMETRIC) ── */}
            {mode === 'register' && regPhase === 'biometric' && (
                <div key="reg-bio" style={cardStyle}>
                    <Header subtitle="ENROLLMENT SUCCESSFUL" />

                    <div style={{
                        background: 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '48px', height: '48px',
                            background: 'rgba(16,185,129,0.1)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <ShieldCheck size={24} color="#10b981" />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>STEP 1 COMPLETE</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.5 }}>
                            Account established for <span style={{ color: '#10b981', fontWeight: 700 }}>{regUsername}</span>. Initialize biometric authentication to simplify future access.
                        </p>
                    </div>

                    <StatusBar />

                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={handleEnrollBiometrics}
                            disabled={isLoading}
                            style={{ ...btnPrimary, background: isLoading ? '#334155' : '#10b981', color: isLoading ? '#94a3b8' : '#000' }}
                        >
                            {isLoading ? (
                                <span>INITIALIZING...</span>
                            ) : (
                                <>
                                    <Fingerprint size={18} />
                                    <span>ENROLL BIOMETRIC AUTHENTICATION</span>
                                </>
                            )}
                        </button>
                        {!isLoading && (
                            <button
                                type="button"
                                onClick={() => enrollBiometrics(regUsername)}
                                style={btnGhost}
                            >
                                <Fingerprint size={16} /> RE-SCAN BIOMETRICS
                            </button>
                        )}
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '1.2rem', color: '#475569', fontSize: '0.65rem', letterSpacing: '1px' }}>
                        PRE-ENCRYPTED AUTHENTICATOR HANDSHAKE REQUIRED
                    </p>

                    {!isLoading && (
                        <button type="button" onClick={() => { localStorage.setItem('scam_registered', 'true'); setMode('returning'); }} style={{ ...btnGhost, color: '#475569', border: '1px solid rgba(71,85,105,0.25)', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                            SKIP BIOMETRICS & GO TO LOGIN
                        </button>
                    )}
                </div>
            )}

            {/* ── MODE: RETURNING (PhonePe style) ── */}
            {mode === 'returning' && (
                <div style={cardStyle}>
                    <Header subtitle="AUTHORIZED PERSONNEL ONLY" />

                    {lastUser ? (
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,0.06)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.7rem', letterSpacing: '2px', marginBottom: '0.5rem', fontWeight: 600 }}>OPERATOR RECOGNIZED</p>
                            <p style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '3px', margin: 0 }}>{username.toUpperCase()}</p>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>OPERATOR ID</label>
                            <div style={{ position: 'relative' }}>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} placeholder="Enter username..." />
                                <Fingerprint size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                            </div>
                        </div>
                    )}

                    <form onSubmit={handlePasswordLogin}>
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>ACCESS CODE</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} placeholder="••••••••" autoFocus={!!lastUser} />
                                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <StatusBar />

                        <div style={{ marginTop: '1.5rem' }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={btnPrimary}
                            >
                                {isLoading ? <span>AUTHORIZING...</span> : <><ShieldCheck size={18} /> VERIFY & ACCESS</>}
                            </button>
                        </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { localStorage.removeItem('scam_last_user'); setUsername(''); }} style={{ ...btnGhost, color: '#64748b', border: 'none', fontSize: '0.7rem' }}>
                            SWITCH OPERATOR
                        </button>
                        <button type="button" onClick={() => { localStorage.removeItem('scam_registered'); setMode('register'); }} style={{ ...btnGhost, color: '#475569', border: '1px solid rgba(71,85,105,0.15)', fontSize: '0.7rem' }}>
                            NEW ENROLLMENT? CREATE ACCOUNT
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <button
                            onClick={() => setIsProtocolOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#10b981',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                opacity: 0.6,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseOut={(e) => (e.currentTarget.style.opacity = '0.6')}
                        >
                            🛡️ CORE SECURITY & PRIVACY PROTOCOL
                        </button>
                    </div>
                </div>
            )}

            <SecurityProtocolModal
                isOpen={isProtocolOpen}
                onClose={() => setIsProtocolOpen(false)}
            />
        </div>
    );
};
