import { useState, useEffect, useRef } from 'react'
import './index.css'

// ── Config ───────────────────────────────────────────────────
// Always use the Render backend so all three portals share the
// same WebSocket feed and database regardless of where they run.
const BACKEND = 'https://scam-detection-1.onrender.com';
const WS_URL = 'wss://scam-detection-1.onrender.com';

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
  const [filter, setFilter] = useState<'case_register' | 'live' | 'locker' | 'freeze' | 'block'>('case_register')
  const [liveCount, setLiveCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  // ── Filtering Logic ──
  const filteredCases = cases.filter(c => {
    if (filter === 'freeze') return actioned[c.id] === 'frozen'
    if (filter === 'block') return actioned[c.id] === 'blocked'
    if (filter === 'locker') return c.iocs && (c.iocs as any).forensics
    if (filter === 'live') return c.classification === 'scam' // Simple filter for live intercepts
    return true
  })

  const currentTabTitle = {
    case_register: '🗂️ Case Register',
    live: '⚡ Live Intercepts',
    locker: '📁 Evidence Locker',
    freeze: '🏦 Active Freeze Requests',
    block: '📵 Number Block Registry'
  }[filter]
  // ── Fetch Cases ──────────────────────────────────────────────
  async function fetchCases() {
    setLoading(true)
    try {
      // Use the PRIVATE Shadow Intelligence endpoint
      const res = await fetch(`${BACKEND}/api/v1/internal/demo/intelligence`, {
        headers: { 
          'X-Auth-Token': '', // Clear common user auth
          'X-Rakshak-Key': 'rakshak_demo_k3y_2024' 
        }
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

  async function explainCase(c: Case) {
    try {
      const res = await fetch(`${BACKEND}/api/v1/internal/demo/explain-incident/${c.id}`, {
        headers: { 'X-Rakshak-Key': 'rakshak_demo_k3y_2024' }
      })
      const data = await res.json()
      addLog('info', `Intelligence Breakdown for #${c.id}: ${data.workflow_steps.map((s: any) => s.detail).join(' -> ')}`)
      addToast(`🧠 AI Explained: ${data.workflow_steps[1].detail}`, 'info')
    } catch {
      addToast('Failed to get AI explanation', 'warning')
    }
  }

  useEffect(() => { fetchCases() }, [])

  // ── WebSocket ────────────────────────────────────────────────
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/api/ws`)
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
              iocs: d.forensics ? { forensics: d.forensics } : {},
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
    ? (cases.reduce((s, c) => {
        const score = c.confidence_score || 0
        return s + (score > 1 ? score / 100 : score)
      }, 0) / cases.length * 100).toFixed(0)
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
        <div className={`sidebar-item ${filter === 'case_register' ? 'active' : ''}`} onClick={() => setFilter('case_register')}>
          <span className="sidebar-icon">📋</span>
          Case Register
          <span className="sidebar-count red">{scamCases}</span>
        </div>
        <div className={`sidebar-item ${filter === 'live' ? 'active' : ''}`} onClick={() => setFilter('live')}>
          <span className="sidebar-icon">⚡</span>
          Live Intercepts
          <span className="sidebar-count">{liveCount}</span>
        </div>
        <div className={`sidebar-item ${filter === 'locker' ? 'active' : ''}`} onClick={() => setFilter('locker')}>
          <span className="sidebar-icon">📁</span>
          Evidence Locker
        </div>

        <div className="sidebar-section-label">Actions</div>
        <div className={`sidebar-item ${filter === 'freeze' ? 'active' : ''}`} onClick={() => setFilter('freeze')}>
          <span className="sidebar-icon">🏦</span>
          Freeze Requests
          <span className="sidebar-count">{cases.filter(c => actioned[c.id] === 'frozen').length}</span>
        </div>
        <div className={`sidebar-item ${filter === 'block' ? 'active' : ''}`} onClick={() => setFilter('block')}>
          <span className="sidebar-icon">📵</span>
          Number Blocks
          <span className="sidebar-count">{cases.filter(c => actioned[c.id] === 'blocked').length}</span>
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
            <div className="section-title">{currentTabTitle}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="filter-badge">Showing: {filter.replace('_', ' ').toUpperCase()}</div>
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
            ) : filteredCases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <div className="empty-state-text">
                  {filter === 'locker' ? 'No evidence bundles found. Generated forensic items appear here.' : 
                   filter === 'freeze' ? 'No active account freezes. Flag a case as "Scam" and click Freeze!' :
                   filter === 'block' ? 'No blocked numbers on record.' :
                   'No cases yet. Send a message from the Scammer Simulator!'}
                </div>
              </div>
            ) : (
              filteredCases.map(c => {
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
                    <div className="confidence-bar-wrap" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <div className="confidence-bar" style={{ width: '100%', height: 4 }}>
                        <div
                          className={`confidence-fill ${level}`}
                          style={{ width: `${Math.round((c.confidence_score ?? 0) * 100)}%` }}
                        />
                      </div>
                      <span className="confidence-label" style={{ fontSize: 9 }}>{Math.round((c.confidence_score ?? 0) * 100)}% Match</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                      <div className="font-semibold" style={{ fontSize: 10 }}>{formatDate(c.created_at)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{formatTime(c.created_at)}</div>
                    </div>
                    <div className="action-row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                      {done === 'frozen' || done === 'blocked' ? (
                        <button className="action-btn done">✓ Done</button>
                      ) : (
                        <>
                          <button className="action-btn explain" onClick={() => explainCase(c)} title="AI Logic Analysis">
                            🧠 AI
                          </button>
                          
                          {c.iocs && (c.iocs as any).forensics && (
                            <>
                              <button 
                                className="action-btn evidence" 
                                onClick={() => {
                                  const url = `${BACKEND}/api/v1/internal/demo/download-report/${(c.iocs as any).forensics.pdf_report}?X-Rakshak-Key=${'rakshak_demo_k3y_2024'}`;
                                  window.open(url, '_blank');
                                  addToast('📄 Forensic Evidence...', 'info');
                             }}
                                title="Forensic PDF"
                              >
                                📄 PDF
                              </button>
                              <button 
                                className="action-btn evidence" 
                                onClick={() => {
                                  const url = `${BACKEND}/api/v1/internal/demo/download-report/${(c.iocs as any).forensics.json_metadata}?X-Rakshak-Key=${'rakshak_demo_k3y_2024'}`;
                                  window.open(url, '_blank');
                                  addToast('💾 JSON...', 'info');
                                }}
                                title="Forensic JSON"
                              >
                                💾 JSON
                              </button>
                            </>
                          )}

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
