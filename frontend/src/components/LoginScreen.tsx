import React, { useState, useEffect, useRef } from 'react';
import { Shield, Cpu, Lock, Fingerprint, EyeOff, Eye, AlertTriangle, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/config';
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
    // @ts-ignore
    const [_regPhase, setRegPhase] = useState<'form' | 'biometric' | 'done'>('form');
    // const [regUsername, setRegUsername] = useState('');
    // const [regPassword, setRegPassword] = useState('');
    const bioAttempted = useRef(false);

    // ── Biometric auto-trigger on arrival (PhonePe style) ──────────────────
    useEffect(() => {
        if (mode === 'returning' && lastUser && window.PublicKeyCredential && !bioAttempted.current) {
            bioAttempted.current = true;
            // Short delay to allow UI to settle before the browser native prompt pops up
            const timer = setTimeout(() => triggerBiometric(lastUser), 800);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const triggerBiometric = async (user: string) => {
        setIsLoading(true);
        setError(null);
        setStatusMsg('SCANNING BIOMETRICS...');
        try {
            const startRes = await fetch(
                `${API_BASE_URL}/api/auth/biometric/login/start?username=${encodeURIComponent(user)}`,
                {
                    method: 'POST',
                    headers: { 'X-Rakshak-Token': 'rakshak-core-v1' }
                }
            );
            if (!startRes.ok) {
                const errData = await startRes.json().catch(() => ({}));
                throw new Error(errData.detail || `login/start failed (${startRes.status})`);
            }
            const rawOptions = await startRes.json();
            const requestOptions = prepareAuthenticationOptions(rawOptions);

            const assertion = await navigator.credentials.get({ publicKey: requestOptions }) as PublicKeyCredential;
            if (!assertion) throw new Error('no_assertion');

            const assResponse = assertion.response as AuthenticatorAssertionResponse;
            const finishRes = await fetch(
                `${API_BASE_URL}/api/auth/biometric/login/finish?username=${encodeURIComponent(user)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Rakshak-Token': 'rakshak-core-v1'
                    },
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
                }
            );
            const data = await finishRes.json();
            if (finishRes.ok && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('scam_last_user', user);
                // Set session BEFORE reload so AuthProvider knows user is authenticated
                sessionStorage.setItem('active_session', JSON.stringify({ id: user, username: user }));
                window.location.reload();
            } else {
                throw new Error(data.detail || 'verification_failed');
            }
        } catch (e: any) {
            console.log("Biometric login failed:", e);
            setStatusMsg(null);
            setError(`BIOMETRIC FAILED: ${e.message || 'unknown error'} — USE ACCESS CODE`);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Registration submit ─────────────────────────────────────────────────
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username.trim() || !password.trim()) { setError('ALL FIELDS REQUIRED'); return; }
        if (password !== confirmPassword) { setError('PASSWORDS DO NOT MATCH'); return; }
        setIsLoading(true);
        try {
            // Step 1: Create account only — do NOT chain biometrics here.
            // Render free tier takes 50+ seconds to wake up. If we chain biometric
            // enrollment immediately after, Chrome's user-gesture timer expires and
            // silently kills the fingerprint prompt.
            await register(username, password);
            localStorage.setItem('scam_registered', 'true');
            localStorage.setItem('scam_last_user', username);
            // setRegUsername(username);
            // setRegPassword(password);
            setStatusMsg('✓ ACCOUNT CREATED — Now tap the button below to set up biometrics');
            setRegPhase('biometric');
        } catch (e: any) {
            setError(e.message || 'REGISTRATION FAILED — TRY AGAIN');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Biometric enroll (separate user gesture after account creation) ──────
    /*
    const handleEnrollBiometrics = async () => {
        setError(null);
        setIsLoading(true);
        try {
            setStatusMsg('FOLLOW DEVICE PROMPT...');
            await enrollBiometrics(regUsername);
            setStatusMsg('✓ BIOMETRICS ENROLLED! Logging you in...');
            // Only login automatically if biometric succeeded
            const success = await login(regUsername, regPassword);
            if (!success) setError('Login failed — try logging in manually');
        } catch (bioErr: any) {
            // Leave error on screen. Do NOT auto-login, otherwise the page reloads
            // and the user never gets to read what went wrong.
            setError(`BIOMETRIC SETUP FAILED: ${bioErr?.message || 'dismissed'} — Please use manual login.`);
            setStatusMsg(null);
            setIsLoading(false);
        }
    };
    */

    // ── Password login submit ───────────────────────────────────────────────
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username.trim() || !password.trim()) { setError('CREDENTIALS REQUIRED'); return; }
        setIsLoading(true);
        try {
            const success = await login(username, password);
            if (!success) {
                setError('ACCESS DENIED: INVALID CREDENTIALS');
            } else {
                localStorage.setItem('scam_last_user', username);
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
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                marginBottom: '1rem'
            }}>
                <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                    <Shield size={32} color="#10b981" strokeWidth={1.5} />
                    <Cpu size={14} color="#10b981" style={{ position: 'absolute', top: '10px', left: '9px' }} />
                </div>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                RAKSHAK<span style={{ color: '#10b981' }}>-AI</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', letterSpacing: '1px' }}>
                {subtitle}
            </p>
        </div>
    );

    const StatusBar = () => (
        <>
            {statusMsg && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <ShieldCheck size={16} /> {statusMsg}
                </div>
            )}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}
        </>
    );

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#e0e0e0', fontFamily: 'monospace', position: 'relative', overflowY: 'auto', paddingTop: '2rem', paddingBottom: '2rem' }}>
            <MatrixRain />

            {/* ── MODE: REGISTER ── */}
            {mode === 'register' && (
                <div style={cardStyle}>
                    <Header subtitle="NEW OPERATOR ENROLLMENT" />
                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CREATE OPERATOR ID</label>
                            <div style={{ position: 'relative' }}>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} placeholder="Choose a username..." />
                                <Fingerprint size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CREATE ACCESS CODE</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} placeholder="••••••••" />
                                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CONFIRM ACCESS CODE</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
                                <ShieldCheck size={18} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
                            </div>
                        </div>
                        <StatusBar />
                        <button type="submit" disabled={isLoading} style={{ ...btnPrimary, background: isLoading ? '#334155' : '#10b981', color: isLoading ? '#94a3b8' : '#000', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                            {isLoading ? <span>CREATING ACCOUNT...</span> : <><UserPlus size={18} /><span>CREATE ACCOUNT &amp; SETUP BIOMETRICS</span></>}
                        </button>
                    </form>
                    <button type="button" onClick={() => { localStorage.setItem('scam_registered', 'true'); setMode('returning'); }} style={{ ...btnGhost, color: '#475569', border: '1px solid rgba(71,85,105,0.25)', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                        ALREADY REGISTERED? SWITCH TO LOGIN
                    </button>
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
                        <button type="submit" disabled={isLoading} style={{ ...btnPrimary }}>
                            {isLoading ? <span>AUTHENTICATING...</span> : <><ShieldCheck size={18} /><span>VERIFY &amp; ACCESS</span></>}
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { localStorage.removeItem('scam_last_user'); setUsername(''); }} style={{ ...btnGhost, color: '#64748b', border: 'none', fontSize: '0.7rem' }}>
                            SWITCH OPERATOR
                        </button>
                        <button type="button" onClick={() => { localStorage.removeItem('scam_registered'); setMode('register'); }} style={{ ...btnGhost, color: '#475569', border: '1px solid rgba(71,85,105,0.15)', fontSize: '0.7rem' }}>
                            NEW ENROLLMENT? CREATE ACCOUNT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

