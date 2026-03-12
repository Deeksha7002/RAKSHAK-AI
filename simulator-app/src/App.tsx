import { useState, useEffect, useRef } from 'react'
import './index.css'

// ── Config ──────────────────────────────────────────────────
const BACKEND = 'http://localhost:8000'

// ── Scam Templates ──────────────────────────────────────────
const SCAM_TEMPLATES = [
  {
    id: 't1', type: 'BANK FRAUD',
    name: 'Account Compromised',
    preview: 'Your account has been flagged...',
    message: 'URGENT: Your bank account #****4821 has been flagged for suspicious activity. To avoid permanent suspension, you must verify your account within 30 minutes. Please call 1800-BANK-HELP or click: http://secure-bank-verify.xyz'
  },
  {
    id: 't2', type: 'TAX SCAM',
    name: 'IRS Final Notice',
    preview: 'Legal action will be initiated...',
    message: 'FINAL NOTICE from the IRS: You owe $4,239 in unpaid taxes. An arrest warrant has been issued in your name. To immediately resolve this, you must purchase Google Play gift cards and call us at 1-800-000-0000. Failure to comply will result in arrest.'
  },
  {
    id: 't3', type: 'TECH SUPPORT',
    name: 'Microsoft Warning',
    preview: 'Your computer has been hacked...',
    message: 'CRITICAL ALERT: Your Windows PC has been hacked and your personal data is being transmitted. Call Microsoft Support immediately at +1-888-999-5555. DO NOT turn off your computer. Your banking credentials are at risk.'
  },
  {
    id: 't4', type: 'LOTTERY',
    name: 'Prize Winner',
    preview: 'Congratulations! You have won...',
    message: 'Congratulations! You have been selected as winner of $50,000 in our National Lottery 2024. To claim your prize, simply send a processing fee of Rs. 5,000 to UPI: prizewin@okhdfcbank or provide your bank account details for direct transfer.'
  },
  {
    id: 't5', type: 'CRYPTO',
    name: 'Investment Opportunity',
    preview: 'Guaranteed 300% ROI in 7 days...',
    message: 'EXCLUSIVE OFFER: Our AI trading bot guarantees 300% returns in 7 days! Send your BTC to wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf... Join 50,000 investors already earning daily. Limited slots available. Act NOW!'
  },
  {
    id: 't6', type: 'PARCEL SCAM',
    name: 'FedEx Package Alert',
    preview: 'Your package is held at customs...',
    message: 'Your FedEx parcel #FXI829201 is being held at customs. A customs duty of Rs. 1,499 must be paid within 24 hours or your package will be returned. Pay immediately at: http://fedex-customs-India.net'
  },
]

// ── Types ────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'scammer' | 'defender'
  text: string
  timestamp: Date
}

interface Toast {
  id: string
  msg: string
}

// ── Utility ──────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── App ──────────────────────────────────────────────────────
function App() {
  const [selected, setSelected] = useState<typeof SCAM_TEMPLATES[0] | null>(null)
  const [customText, setCustomText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [msgCount, setMsgCount] = useState(0)
  const [interceptCount, setInterceptCount] = useState(0)
  const [iocs, setIocs] = useState<string[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const phoneRef = useRef(`+91${Math.floor(7000000000 + Math.random() * 2999999999)}`)

  // Auto-scroll chat
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  // WebSocket connection
  useEffect(() => {
    const connectWs = () => {
      const ws = new WebSocket(`ws://localhost:8000/api/ws`)
      wsRef.current = ws

      ws.onopen = () => console.log('🔌 WebSocket connected to Rakshak AI')

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data)
          if (payload.type === 'NEW_INTERCEPT') {
            const d = payload.data
            setInterceptCount(c => c + 1)
            addToast(`🛡️ INTERCEPT DETECTED: ${d.classification?.toUpperCase() || 'SCAM'}`)
          }
        } catch { /* ignore */ }
      }

      ws.onclose = () => setTimeout(connectWs, 3000)
    }

    connectWs()
    return () => wsRef.current?.close()
  }, [])

  function addToast(msg: string) {
    const id = uid()
    setToasts(t => [...t, { id, msg }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }

  function pickTemplate(t: typeof SCAM_TEMPLATES[0]) {
    setSelected(t)
    setCustomText(t.message)
    // extract IOCs preview
    const urls = (t.message.match(/https?:\/\/[^\s]+|[\w.]+\.xyz|[\w.]+\.net/g) || [])
    setIocs(prev => [...new Set([...prev, ...urls])])
  }

  async function sendScam() {
    const msg = customText.trim()
    if (!msg || sending) return

    setSending(true)
    setMsgCount(c => c + 1)

    // Add outgoing message to chat
    const outMsg: Message = { id: uid(), role: 'scammer', text: msg, timestamp: new Date() }
    setMessages(prev => [...prev, outMsg])
    setCustomText('')

    try {
      // Show typing indicator
      setTimeout(() => setTyping(true), 300)

      // POST to Rakshak AI webhook
      const body = new URLSearchParams({ From: phoneRef.current, Body: msg })
      const res = await fetch(`${BACKEND}/api/webhooks/twilio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      })

      // Parse TwiML response for the message text
      const xml = await res.text()
      const match = xml.match(/<Message(?:\s[^>]*)?>([\s\S]*?)<\/Message>/i)
      const reply = match ? match[1].trim() : String(xml).trim() || 'No response.'

      setTyping(false)

      const inMsg: Message = { id: uid(), role: 'defender', text: reply, timestamp: new Date() }
      setMessages(prev => [...prev, inMsg])

      if (!res.ok) addToast(`⚠️ Backend returned ${res.status}`)
    } catch (err) {
      setTyping(false)
      addToast('❌ Connection failed. Is the backend running?')
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendScam()
    }
  }

  const threatLevel = messages.length === 0 ? 'low' : messages.length < 3 ? 'medium' : 'high'
  const threatLabel = threatLevel === 'high' ? '⬤ ACTIVE SCAM' : threatLevel === 'medium' ? '◐ ENGAGING' : '○ IDLE'

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <span className="header-skull">💀</span>
          <div>
            <div className="header-title">Scammer Simulator</div>
            <div className="header-subtitle">Rakshak AI Ecosystem // Demo Tool</div>
          </div>
        </div>
        <div className="header-status">
          <div className="status-dot" />
          CONNECTED TO RAKSHAK AI
        </div>
      </header>

      <div className="main-content">
        {/* ── Left Panel: Templates ── */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-header-icon">🗂️</span>
            <span className="panel-header-title">Scam Templates</span>
          </div>
          <div className="panel-body">
            {SCAM_TEMPLATES.map(t => (
              <div
                key={t.id}
                className={`template-card ${selected?.id === t.id ? 'selected' : ''}`}
                onClick={() => pickTemplate(t)}
              >
                <div className="template-type">{t.type}</div>
                <div className="template-name">{t.name}</div>
                <div className="template-preview">{t.preview}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center: Chat Window ── */}
        <div className="panel chat-panel">
          <div className="chat-thread-header">
            <div className="thread-id">THREAD: {phoneRef.current} // SMS</div>
            <div className={`threat-badge ${threatLevel}`}>{threatLabel}</div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div className="chat-empty-icon">📡</div>
                <div className="chat-empty-text">SELECT A TEMPLATE & SEND A MESSAGE</div>
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={`msg-row ${m.role}`}>
                <div className="msg-avatar">
                  {m.role === 'scammer' ? '💀' : '🤖'}
                </div>
                <div className="msg-bubble">
                  <div className="msg-label">
                    {m.role === 'scammer' ? `YOU  ·  ${formatTime(m.timestamp)}` : `RAKSHAK AI PERSONA  ·  ${formatTime(m.timestamp)}`}
                  </div>
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="msg-row defender">
                <div className="msg-avatar">🤖</div>
                <div className="msg-bubble">
                  <div className="msg-label">RAKSHAK AI IS RESPONDING...</div>
                  <div className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                className="chat-textarea"
                placeholder="Type your scam message or select a template above..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <button
                className="send-btn"
                onClick={sendScam}
                disabled={!customText.trim() || sending}
              >
                {sending ? '...' : 'SEND'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Intelligence ── */}
        <div className="panel intel-panel">
          <div className="panel-header">
            <span className="panel-header-icon">📊</span>
            <span className="panel-header-title">Session Intel</span>
          </div>
          <div className="panel-body">
            <div className="intel-stat-card">
              <div className="intel-stat-label">Messages Sent</div>
              <div className="intel-stat-value">{msgCount}</div>
              <div className="intel-stat-sub">This session</div>
            </div>
            <div className="intel-stat-card">
              <div className="intel-stat-label">Intercepts</div>
              <div className="intel-stat-value" style={{ color: 'var(--accent-green)' }}>{interceptCount}</div>
              <div className="intel-stat-sub">Caught by Rakshak AI</div>
            </div>
            <div className="intel-stat-card">
              <div className="intel-stat-label">Responses</div>
              <div className="intel-stat-value" style={{ color: 'var(--accent-orange)' }}>
                {messages.filter(m => m.role === 'defender').length}
              </div>
              <div className="intel-stat-sub">AI Persona Replies</div>
            </div>

            <hr className="divider" />

            <div style={{ marginBottom: 8 }}>
              <div className="intel-stat-label" style={{ marginBottom: 8 }}>Extracted IOCs</div>
              {iocs.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  None detected yet.
                </div>
              ) : (
                iocs.map((ioc, i) => (
                  <span key={i} className="ioc-tag">{ioc}</span>
                ))
              )}
            </div>

            <hr className="divider" />

            <div>
              <div className="intel-stat-label" style={{ marginBottom: 8 }}>Your Mock Identity</div>
              <span className="ioc-tag green">📱 {phoneRef.current}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast Notifications ── */}
      <div style={{ position: 'fixed', top: 70, right: 20, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className="alert-toast">
            <span className="alert-toast-icon">🛡️</span>
            <span className="alert-toast-text">{t.msg}</span>
            <button className="alert-toast-close" onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
