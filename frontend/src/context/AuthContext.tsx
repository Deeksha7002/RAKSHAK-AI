import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../lib/config';

interface User {
    id: string;
    username: string;
}

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    register: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Token Storage Keys ────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = 'rakshak_access_token';
const REFRESH_TOKEN_KEY = 'rakshak_refresh_token';
const SESSION_USER_KEY = 'active_session';

// ── Decode JWT without a library ──────────────────────────────────────────────
function decodeJwtPayload(token: string): { sub?: string; exp?: number } | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            window.atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// ── How many seconds before expiry to proactively refresh ─────────────────────
const REFRESH_BEFORE_EXPIRY_SECONDS = 60;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Silent token refresh ──────────────────────────────────────────────────
    const scheduleRefresh = (accessToken: string) => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

        const payload = decodeJwtPayload(accessToken);
        if (!payload?.exp) return;

        const expiresInMs = (payload.exp * 1000) - Date.now();
        const refreshInMs = expiresInMs - (REFRESH_BEFORE_EXPIRY_SECONDS * 1000);

        if (refreshInMs <= 0) {
            // Already expired — try refresh immediately
            silentRefresh();
            return;
        }

        refreshTimerRef.current = setTimeout(() => silentRefresh(), refreshInMs);
    };

    const silentRefresh = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            // No refresh token — user must log in again
            handleLogout();
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem(ACCESS_TOKEN_KEY, data.token);
                scheduleRefresh(data.token);
                console.log('[Auth] 🔄 Access token silently refreshed');
            } else {
                // Refresh token expired or revoked — force re-login
                console.warn('[Auth] Refresh failed — logging out');
                handleLogout();
            }
        } catch (e) {
            console.error('[Auth] Silent refresh error', e);
        }
    };

    const handleLogout = () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        setCurrentUser(null);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_USER_KEY);
        // Note: refresh_token is intentionally NOT removed yet — logout() calls /api/auth/logout to revoke it
    };

    // ── Restore session on page load ─────────────────────────────────────────
    useEffect(() => {
        const savedSession = sessionStorage.getItem(SESSION_USER_KEY);
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (savedSession && accessToken) {
            try {
                const payload = decodeJwtPayload(accessToken);
                const isExpired = payload?.exp ? (payload.exp * 1000) < Date.now() : true;

                if (!isExpired) {
                    setCurrentUser(JSON.parse(savedSession));
                    scheduleRefresh(accessToken);
                } else {
                    // Token expired — try silent refresh before giving up
                    silentRefresh().then(() => {
                        if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
                            setCurrentUser(JSON.parse(savedSession));
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to restore session', e);
            }
        }

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    // ── Login ────────────────────────────────────────────────────────────────
    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password: password.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem(ACCESS_TOKEN_KEY, data.token);
                if (data.refresh_token) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
                }

                const payload = decodeJwtPayload(data.token);
                const sessionUser = { id: payload?.sub ?? username, username: payload?.sub ?? username };
                setCurrentUser(sessionUser);
                sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
                scheduleRefresh(data.token);
                return true;
            }
        } catch (e) {
            console.error('Login failed', e);
        }
        return false;
    };

    // ── Register ─────────────────────────────────────────────────────────────
    const register = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password: password.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                // Store tokens if returned immediately (no biometric step)
                if (data.token) {
                    localStorage.setItem(ACCESS_TOKEN_KEY, data.token);
                    if (data.refresh_token) {
                        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
                    }
                }
                return true;
            } else {
                let errorMsg = `Error [${res.status}]`;
                try {
                    const errorData = await res.json();
                    errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
                } catch {
                    errorMsg = `${errorMsg}: Unknown Server Error`;
                }
                throw new Error(errorMsg);
            }
        } catch (e: any) {
            const finalMsg = e instanceof Error ? e.message : String(e);
            throw new Error(finalMsg || 'Connection Failed - Check Network');
        }
    };

    // ── Logout ───────────────────────────────────────────────────────────────
    const logout = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
            // Revoke server-side (fire and forget)
            fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            }).catch(() => { });
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
        handleLogout();
    };

    // ── Get current access token (for use in API calls) ──────────────────────
    const getToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAuthenticated: !!currentUser,
            login,
            register,
            logout,
            getToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
