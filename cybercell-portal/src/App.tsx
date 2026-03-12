import { useState, useEffect, useRef } from 'react'
import './index.css'

// ── Config ───────────────────────────────────────────────────
const BACKEND = 'http://localhost:8000'

// ── Types ────────────────────────────────────────────────────
interface Case {
  id: number
  conversation_id: string
  scammer_name: string
  platform: string
  classification: string
  scam_type: string | null
  confidence_score: number
  iocs: Record<string, unknown>
  transcript: string
  auto_reported: boolean
  created_at: string
}

interface LogEntry {
  id: string
  type: 'success' | 'warning' | 'info'
  msg: string
  time: string
}

interface Toast { id: string; msg: string; type: 'success' | 'warning' | 'info' }

// ── Helpers ──────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

function confLevel(score: number) {
  if (score > 0.7) return 'high'
  if (score > 0.4) return 'medium'
  return 'low'
}

// ── Dummy cases for demo when server has no real cases ────────
const DEMO_CASES: Case[] = [
  { id: 1, conversation_id: 'sms_+918056579353', scammer_name: '+918056579353', platform: 'sms', classification: 'scam', scam_type: 'Financial', confidence_score: 0.92, iocs: { phone: '+918056579353', urls: ['http://secure-bank-verify.xyz'] }, transcript: '[]', auto_reported: true, created_at: new Date().toISOString() },
  { id: 2, conversation_id: 'sms_+917001234567', scammer_name: '+917001234567', platform: 'sms', classification: 'likely_scam', scam_type: 'Impersonation', confidence_score: 0.61, iocs: { phone: '+917001234567', urls: [] }, transcript: '[]', auto_reported: false, created_at: new Date(Date.now() - 3600000).toISOString() },
]

// ── Main App ─────────────────────────────────────────────────
function App() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLog, setActionLog] = useState<LogEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [actioned, setActioned] = useState<Record<number, string>>({})
  const [liveCount, setLiveCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  // ── Fetch Cases ──────────────────────────────────────────────
  async function fetchCases() {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/cases`, {
        // Note: /api/cases is auth-protected; for the demo we fall back to demo data
        headers: {}
      })
      if (res.ok) {
        const data: Case[] = await res.json()
        setCases(data.length > 0 ? data : DEMO_CASES)
      } else {
        setCases(DEMO_CASES)
      }
    } catch {
      setCases(DEMO_CASES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCases() }, [])

  // ── WebSocket ────────────────────────────────────────────────
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`ws://localhost:8000/api/ws`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const p = JSON.parse(e.data)
          if (p.type === 'NEW_INTERCEPT') {
            setLiveCount(c => c + 1)
            const d = p.data
            const newCase: Case = {
              id: Date.now(),
              conversation_id: d.threadId || uid(),
              scammer_name: d.threadId?.replace('sms_', '') || 'Unknown',
              platform: 'sms',
              classification: d.classification || 'likely_scam',
              scam_type: d.intent || 'Unknown',
              confidence_score: 0.85,
              iocs: {},
              transcript: '[]',
              auto_reported: true,
              created_at: new Date().toISOString()
            }
            setCases(prev => [newCase, ...prev])
            addLog('info', `New intercept: ${newCase.conversation_id}`)
            addToast(`⚡ Live Intercept: ${newCase.classification.toUpperCase()} from ${newCase.scammer_name}`, 'info')
          }
        } catch { /* ignore */ }
      }

      ws.onclose = () => setTimeout(connect, 3000)
    }
    connect()
    return () => wsRef.current?.close()
  }, [])

  // ── Helpers ──────────────────────────────────────────────────
  function addLog(type: LogEntry['type'], msg: string) {
    const entry: LogEntry = { id: uid(), type, msg, time: new Date().toLocaleTimeString() }
    setActionLog(prev => [entry, ...prev].slice(0, 50))
  }

  function addToast(msg: string, type: Toast['type'] = 'info') {
    const id = uid()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }

  // ── Actions ──────────────────────────────────────────────────
  function handleFreeze(c: Case) {
    setActioned(prev => ({ ...prev, [c.id]: 'frozen' }))
    addLog('warning', `Account/UPI linked to ${c.scammer_name} flagged for freeze. Report sent to NPCI.`)
    addToast(`🏦 Bank freeze initiated for ${c.scammer_name}`, 'warning')
  }

  function handleBlock(c: Case) {
    setActioned(prev => ({ ...prev, [c.id]: 'blocked' }))
    addLog('success', `Number ${c.scammer_name} reported to DoT for blocking.`)
    addToast(`📵 Number blocked for ${c.scammer_name}`, 'success')
  }

  // ── Stats ────────────────────────────────────────────────────
  const totalCases = cases.length
  const scamCases = cases.filter(c => c.classification === 'scam').length
  const actionedCount = Object.keys(actioned).length
  const avgConf = cases.length > 0
    ? (cases.reduce((s, c) => s + (c.confidence_score || 0), 0) / cases.length * 100).toFixed(0)
    : '0'

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-emblem">🛡️</span>
          <div>
            <div className="header-title">Cybercell Enforcement Portal</div>
            <div className="header-subtitle">Ministry of Home Affairs // Cyber Crime Division // Rakshak AI</div>
          </div>
        </div>
        <div className="header-right">
          <div className="live-badge">
            <div className="live-dot" />
            LIVE FEED ACTIVE
          </div>
          <div className="user-pill">
            <div className="user-avatar">CC</div>
            <span>Inspector CCPD</span>
          </div>
        </div>
      </header>

      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-section-label">Operations</div>
        <div className="sidebar-item active">
          <span className="sidebar-icon">📋</span>
          Case Register
          <span className="sidebar-count red">{scamCases}</span>
        </div>
        <div className="sidebar-item">
          <span className="sidebar-icon">⚡</span>
          Live Intercepts
          <span className="sidebar-count">{liveCount}</span>
        </div>
        <div className="sidebar-item">
          <span className="sidebar-icon">📁</span>
          Evidence Locker
        </div>

        <div className="sidebar-section-label">Actions</div>
        <div className="sidebar-item">
          <span className="sidebar-icon">🏦</span>
          Freeze Requests
          <span className="sidebar-count">{actionedCount}</span>
        </div>
        <div className="sidebar-item">
          <span className="sidebar-icon">📵</span>
          Number Blocks
        </div>

        <div className="sidebar-section-label">Reports</div>
        <div className="sidebar-item">
          <span className="sidebar-icon">📊</span>
          Analytics
        </div>
        <div className="sidebar-item">
          <span className="sidebar-icon">📄</span>
          PDF Export
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon blue">📋</div>
            <div>
              <div className="stat-label">Total Cases</div>
              <div className="stat-value">{totalCases}</div>
              <div className="stat-sub">All intercepted</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">🚨</div>
            <div>
              <div className="stat-label">Confirmed Scams</div>
              <div className="stat-value">{scamCases}</div>
              <div className="stat-sub">High confidence</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-label">Actions Taken</div>
              <div className="stat-value">{actionedCount}</div>
              <div className="stat-sub">Frozen / Blocked</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">📡</div>
            <div>
              <div className="stat-label">Avg. Confidence</div>
              <div className="stat-value">{avgConf}%</div>
              <div className="stat-sub">AI certainty</div>
            </div>
          </div>
        </div>

        {/* ── Case Register ── */}
        <div className="section">
          <div className="section-header">
            <div className="section-title">🗂️ Case Register</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="filter-badge">Showing: All Cases</div>
              <button className="refresh-btn" onClick={fetchCases}>⟳ Refresh</button>
            </div>
          </div>

          <div className="case-table">
            <div className="case-table-head">
              <span>Case ID</span>
              <span>Source</span>
              <span>Classification</span>
              <span>Confidence</span>
              <span>Reported</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="spinner" />
                <div className="empty-state-text">Loading cases...</div>
              </div>
            ) : cases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <div className="empty-state-text">No cases yet. Send a message from the Scammer Simulator!</div>
              </div>
            ) : (
              cases.map(c => {
                const level = confLevel(c.confidence_score ?? 0)
                const done = actioned[c.id]
                return (
                  <div key={c.id} className="case-row">
                    <div className="case-id">#{String(c.id).padStart(4, '0')}</div>
                    <div className="case-platform">
                      <span>{c.platform === 'sms' ? '📱' : '📧'}</span>
                      <span style={{ fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.scammer_name}
                      </span>
                    </div>
                    <div>
                      <span className={`classification-badge ${c.classification}`}>
                        {c.classification?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="confidence-bar-wrap">
                      <div className="confidence-bar">
                        <div
                          className={`confidence-fill ${level}`}
                          style={{ width: `${Math.round((c.confidence_score ?? 0) * 100)}%` }}
                        />
                      </div>
                      <span className="confidence-label">{Math.round((c.confidence_score ?? 0) * 100)}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {formatDate(c.created_at)}<br />
                      <span style={{ color: 'var(--text-muted)' }}>{formatTime(c.created_at)}</span>
                    </div>
                    <div className="action-row">
                      {done === 'frozen' || done === 'blocked' ? (
                        <button className="action-btn done">✓ Done</button>
                      ) : (
                        <>
                          <button className="action-btn freeze" onClick={() => handleFreeze(c)} title="Freeze bank account / UPI">
                            🏦 Freeze
                          </button>
                          <button className="action-btn block" onClick={() => handleBlock(c)} title="Block number via DoT">
                            📵 Block
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Action Log ── */}
        <div className="section" style={{ paddingTop: 0 }}>
          <div className="section-header">
            <div className="section-title">📜 Enforcement Action Log</div>
          </div>
          <div className="action-log">
            {actionLog.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '16px 0' }}>
                No actions taken yet. Click Freeze or Block on a case above.
              </div>
            ) : (
              actionLog.map(l => (
                <div key={l.id} className="log-entry">
                  <div className={`log-dot ${l.type}`} />
                  <div className="log-time">{l.time}</div>
                  <div className="log-msg">{l.msg}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ── Toasts ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
