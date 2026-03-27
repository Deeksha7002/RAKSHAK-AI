import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Send, Plus, MoreVertical, ArrowLeft, CheckCheck } from 'lucide-react'
import './index.css'

// ── Config ──────────────────────────────────────────────────
const BACKEND = 'http://localhost:8000'

// ── Types ────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
  persona?: string
  media?: { type: 'image' | 'video' | 'audio'; url: string }
}

// ── Utility ──────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null) // 'image' | 'video' | 'audio'
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef(`+91 ${Math.floor(70000 + Math.random() * 29999)} ${Math.floor(10000 + Math.random() * 89999)}`)

  useEffect(() => {
    window.localStorage.setItem('rakshak_demo_sender', phoneRef.current)
  }, [])

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing, uploading])

  // Sandbox State Sync
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SLOW_MO_STATE') {
        (window as any).isSlowMoEnabled = e.data.value
      }
    }
    window.addEventListener('message', handleMessage)
    if (window.parent !== window) window.parent.postMessage('GET_SLOW_MO', '*')
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Demo Triggers (Internal)
  useEffect(() => {
    (window as any).demoTriggerImage = () => {
      // Simulate a file input change event for an image
      // Using a dummy File object, the actual image URL will be set in handleFileSelect
      handleFileSelect({ 
        target: { 
          files: [new File([""], "demo_evidence.png", { type: "image/png" })] 
        } 
      } as any)
    };
  }, [])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type.startsWith('video/') ? 'video' : 
                 file.type.startsWith('audio/') ? 'audio' : 'text'
    
    if (type === 'text') return

    setUploading(type)
    const url = URL.createObjectURL(file)
    
    // Simulate forensic scan delay
    setTimeout(async () => {
      const outMsg: Message = { 
        id: uid(), 
        role: 'user', 
        text: `Shared a ${type}`, 
        timestamp: new Date(),
        media: { type, url }
      }
      setMessages(prev => [...prev, outMsg])
      setUploading(null)
      
      // Trigger ingest for media
      await shadowIngest(outMsg.text, type, url)
    }, 1500)
  }

  async function sendMessage() {
    const text = inputText.trim()
    if (!text || sending) return

    setSending(true)
    const outMsg: Message = { id: uid(), role: 'user', text, timestamp: new Date() }
    setMessages(prev => [...prev, outMsg])
    setInputText('')

    await shadowIngest(text)
    setSending(false)
  }

  async function shadowIngest(text: string, mediaType?: string, mediaUrl?: string) {
    try {
      setTyping(true)
      let slowMo = (window as any).isSlowMoEnabled || false

      const res = await fetch(`${BACKEND}/api/v1/internal/demo/ingest`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Rakshak-Key': 'rakshak_demo_k3y_2024'
        },
        body: JSON.stringify({ 
          sender: phoneRef.current, 
          message: text,
          platform: 'secure_comm_v4',
          slow_mo: slowMo,
          media_type: mediaType,
          media_url: mediaUrl
        })
      })

      const data = await res.json()
      setTyping(false)

      if (data.response) {
        const inMsg: Message = { 
          id: uid(), 
          role: 'assistant', 
          text: data.response, 
          timestamp: new Date(),
          persona: data.persona
        }
        setMessages(prev => [...prev, inMsg])
      }
    } catch (err) {
      setTyping(false)
    }
  }

  return (
    <div className="secure-app">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*,video/*,audio/*"
        onChange={handleFileSelect}
      />
      
      {/* --- High-Gloss Premium Header --- */}
      <header className="premium-header">
        <div className="header-left">
           <div className="glass-btn"><ArrowLeft size={18} /></div>
           <div className="user-profile">
              <div className="avatar-glow">
                 <Shield size={20} className="text-cyan-400" />
              </div>
              <div className="profile-info">
                 <div className="name">Rakshak Secure-Comm</div>
                 <div className="status">
                    <span className="pulse-dot" /> 
                    <span className="status-text">ENCRYPTED ACTIVE</span>
                 </div>
              </div>
           </div>
        </div>
        <div className="header-right">
           <button className="glass-btn px-4 w-auto text-[10px] font-bold text-cyan-400" onClick={() => (window as any).demoTriggerImage()}>
             DEMO SCAN
           </button>
           <div className="glass-btn"><MoreVertical size={18} /></div>
        </div>
      </header>

      {/* --- Cinematic Chat Viewport --- */}
      <div className="viewport">
         <div className="scroll-area">
            <div className="security-notice">
               <Shield size={12} />
               <span>Messages are secured with Rakshak Neural-Enclave™</span>
            </div>

            <AnimatePresence initial={false}>
               {messages.map((m) => (
                 <motion.div 
                   key={m.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`message-row ${m.role}`}
                 >
                   <div className="bubble">
                     {m.role === 'assistant' && (
                       <div className="flex items-center gap-1.5 mb-2 px-1">
                         <Shield size={10} className="text-cyan-400 fill-cyan-400/20" />
                         <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase italic">
                            Rakshak AI: {m.persona || 'Guardian'}
                         </span>
                       </div>
                     )}

                     {m.media && (
                       <div className="media-container mb-2">
                         {m.media.type === 'image' && <img src={m.media.url} className="media-preview image" alt="Evidence" />}
                         {m.media.type === 'video' && <video src={m.media.url} className="media-preview video" controls />}
                         {m.media.type === 'audio' && <audio src={m.media.url} className="media-preview audio" controls />}
                         
                         <div className="media-scanner">
                           <div className="scan-line" />
                           <div className="scan-text">CORE FORENSIC SCAN ACTIVE...</div>
                         </div>
                       </div>
                     )}

                     <div className={`message-bubble ${m.role === 'user' ? 'user' : 'assistant'} ${m.media ? 'has-media' : ''}`}>
                       <div className="text-sm font-medium leading-relaxed">{m.text}</div>
                       <div className="time">
                         {formatTime(m.timestamp)} 
                         {m.role === 'user' && <CheckCheck size={12} className="inline ml-1 opacity-70" />}
                       </div>
                     </div>
                     {m.role === 'user' && <div className="bubble-glow" />}
                   </div>
                 </motion.div>
               ))}
            </AnimatePresence>

            {uploading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-row user">
                    <div className="bubble">
                        <div className="media-container loading">
                            <div className="spinner" />
                            <div className="text-[10px] uppercase font-bold text-white/50 mt-2">Uploading {uploading}...</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {typing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="message-row assistant"
              >
                <div className="bubble">
                  <div className="typing-bubble">
                    <div className="dots">
                        <span /><span /><span />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} className="h-20" />
         </div>
      </div>

      {/* --- Futuristic Floating Pill Input --- */}
      <footer className="pill-footer">
         <motion.div 
           className="input-pill"
           whileFocus={{ scale: 1.01 }}
         >
            <button className="pill-action" onClick={() => fileInputRef.current?.click()}>
              <Plus size={20} />
            </button>
            <input 
              className="pill-input"
              placeholder="Send message or attachment..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button 
              className={`pill-send ${inputText.trim() ? 'active' : ''}`}
              onClick={sendMessage}
              disabled={!inputText.trim() || sending}
            >
              <Send size={18} />
            </button>
         </motion.div>
      </footer>

      {/* Background Ambience */}
      <div className="bg-noise" />
      <div className="bg-gradient-top" />

    </div>
  )
}
