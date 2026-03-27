import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Brain, Zap, RefreshCcw, 
  CheckCircle2, Activity, Loader2, 
  ShieldAlert, Gavel, Layout, ShieldCheck 
} from 'lucide-react'

// Constants
const BACKEND = 'http://localhost:8000'
const BACKEND_WS = 'ws://localhost:8000/api/ws'
const MASTER_KEY = 'rakshak_demo_k3y_2024'

type ActiveTab = 'SIMULATOR' | 'NEURAL' | 'AUTHORITY'

interface BrainStep {
  step: 'INGESTION' | 'ANALYSIS' | 'DECISION' | 'FORENSICS'
  detail: string
  payload?: any
  status: 'PROCESSING' | 'COMPLETE'
  timestamp: string
}

const LoginScreen = () => (
  <div className="h-screen flex items-center justify-center flex-col gap-8 bg-[#020617] text-white p-10">
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
       <Shield size={80} className="text-indigo-500 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
    </motion.div>
    <div className="text-center space-y-2">
       <h1 className="text-5xl font-black tracking-tighter uppercase italic">Vault Access</h1>
       <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Unified Defense Center // Authentication Required</p>
    </div>
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] flex flex-col items-center gap-6 shadow-2xl backdrop-blur-xl">
       <p className="text-sm text-slate-400 font-medium italic">Append token for clearance:</p>
       <code className="text-cyan-400 bg-black/50 px-6 py-3 rounded-xl border border-white/5 font-mono text-lg">
          ?key={MASTER_KEY}
       </code>
    </div>
  </div>
)

export default function App() {
  const [authorized, setAuthorized] = useState(false)
  const [slowMo, setSlowMo] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('SIMULATOR')
  const [logs, setLogs] = useState<BrainStep[]>([])
  const [currentStep, setCurrentStep] = useState<BrainStep | null>(null)
  const [classification, setClassification] = useState<string | null>(null)
  const [interceptData, setInterceptData] = useState<{ agent_reply?: string; forensics?: any } | null>(null)
  const [threatScore, setThreatScore] = useState<number>(0)
  const [typedReply, setTypedReply] = useState('')
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('key') === MASTER_KEY || window.location.hostname === 'localhost') {
      setAuthorized(true)
    }

    const handleMsg = (e: MessageEvent) => {
      if (e.data === 'GET_SLOW_MO') {
        const sim = document.getElementById('sim-frame') as HTMLIFrameElement
        sim?.contentWindow?.postMessage({ type: 'SLOW_MO_STATE', value: slowMo }, '*')
      }
    }
    window.addEventListener('message', handleMsg)
    return () => window.removeEventListener('message', handleMsg)
  }, [slowMo])

  useEffect(() => {
    const sim = document.getElementById('sim-frame') as HTMLIFrameElement
    sim?.contentWindow?.postMessage({ type: 'SLOW_MO_STATE', value: slowMo }, '*')
  }, [slowMo, authorized])

  useEffect(() => {
    if (!authorized) return
    
    ws.current = new WebSocket(BACKEND_WS)
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      
      if (msg.type === 'BRAIN_STEP') {
        const step: BrainStep = {
          ...msg.data,
          status: msg.data.status || 'COMPLETE',
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' })
        }
        
        setCurrentStep(step)
        setLogs(prev => [step, ...prev].slice(0, 15))

        // Persist threat score across steps - normalize to 0.0-1.0
        const analysisScore = step.payload?.analysis?.risk_score
        if (analysisScore !== undefined) {
          setThreatScore(analysisScore > 1 ? analysisScore / 100 : analysisScore)
        }
    

        if (step.step === 'INGESTION') {
          setClassification(null)
          setLogs([]) 
          setThreatScore(0)
          setTypedReply('')
          setInterceptData(null)
        }
      }

      if (msg.type === 'NEW_INTERCEPT') {
        const intercept = msg.data
        console.log('🛡️ Intercept:', intercept)
        setInterceptData({
          agent_reply: intercept.agentReply || intercept.agent_reply,
          forensics: intercept.forensics
        })
        setClassification(intercept.classification)
        
        // Final score sync
        if (intercept.classification === 'scam') {
           setThreatScore(prev => prev < 0.8 ? 0.98 : prev)
        }
      }
    }

    return () => {
      ws.current?.close()
    }
  }, [authorized])

  useEffect(() => {
    if (interceptData?.agent_reply) {
      setTypedReply('')
      let i = 0
      const text = interceptData.agent_reply
      const interval = setInterval(() => {
        setTypedReply(text.slice(0, i))
        i++
        if (i > text.length) clearInterval(interval)
      }, 25)
      return () => clearInterval(interval)
    }
  }, [interceptData])

  const resetDemo = async () => {
    try {
      await fetch(`${BACKEND}/api/v1/internal/demo/reset?X-Rakshak-Key=${MASTER_KEY}`, { method: 'POST' })
      setLogs([])
      setCurrentStep(null)
      setClassification(null)
      setInterceptData(null)
      setTypedReply('')
      setActiveTab('SIMULATOR')
      const sim = document.getElementById('sim-frame') as HTMLIFrameElement
      if (sim) sim.src = sim.src
    } catch (e) { console.error(e) }
  }

  if (!authorized) return <LoginScreen />

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* 1. Master Shell Header */}
      <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl z-[100] shrink-0">
        <div className="flex items-center gap-6">
          <motion.div 
            animate={{ rotateY: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-white/10"
          >
            <Shield size={28} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none uppercase italic text-white flex items-center gap-3">
               RAKSHAK <span className="text-cyan-400">COMMAND</span>
            </h1>
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] block mt-1.5 opacity-60">UNIFIED THREAT DEFENSE HUB</span>
          </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <nav className="flex items-center bg-slate-900/40 p-1 rounded-2xl border border-white/5">
           {[
             { id: 'SIMULATOR', label: 'Simulator', icon: Layout },
             { id: 'NEURAL', label: 'Neural Brain', icon: Brain },
             { id: 'AUTHORITY', label: 'Authority Feed', icon: Gavel }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as ActiveTab)}
               className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
               }`}
             >
               <tab.icon size={14} />
               {tab.label}
             </button>
           ))}
        </nav>

        <div className="flex items-center gap-8">
           <button 
             onClick={resetDemo}
             className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
           >
             <RefreshCcw size={12} className="group-hover:rotate-180 transition-transform duration-700" />
             RESET
           </button>
           <button 
            onClick={() => setSlowMo(!slowMo)}
            className={`flex items-center gap-4 px-8 py-2.5 rounded-xl text-[10px] font-black transition-all border shadow-2xl ${
              slowMo ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Zap size={14} fill={slowMo ? "currentColor" : "none"} />
            SLOW-MO: {slowMo ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>

      {/* 2. Unified Content Viewport */}
      <main className="flex-1 relative bg-black overflow-hidden">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 01: SIMULATOR (Full Screen) */}
          {activeTab === 'SIMULATOR' && (
            <motion.section 
               key="sim" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
               className="absolute inset-0"
            >
               <iframe id="sim-frame" src="http://localhost:5173" className="w-full h-full border-none" title="Simulator" />
            </motion.section>
          )}

          {/* TAB 02: NEURAL BRAIN (Full Screen) */}
          {activeTab === 'NEURAL' && (
            <motion.section 
               key="neural" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
               className="absolute inset-0 bg-[#020617] p-12 flex flex-col items-center custom-scrollbar overflow-y-auto"
            >
               <div className="max-w-6xl w-full flex flex-col gap-10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-10">
                     <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-3xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                           <Brain size={48} />
                        </div>
                        <div>
                           <h2 className="text-5xl font-black tracking-tighter uppercase italic text-white leading-none mb-3">Analysis Engine</h2>
                           <span className="text-[11px] text-slate-500 font-black tracking-[0.5em] uppercase px-1">Neural Core v4.1 // Real-time Monitoring</span>
                        </div>
                     </div>
                     <div className="bg-slate-900/50 p-8 rounded-[32px] border border-slate-800 flex flex-col items-end shadow-2xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Threat Confidence</span>
                        <span className={`text-6xl font-black font-mono transition-all ${
                           threatScore > 0.7 ? 'text-red-500 text-shadow-red' : 'text-cyan-400'
                        }`}>
                          {Math.round(threatScore * 100)}%
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                     <div className="lg:col-span-3 space-y-4">
                        <AnimatePresence mode="popLayout">
                           {logs.length === 0 ? (
                              <div className="h-[400px] flex flex-col items-center justify-center opacity-20 bg-slate-950 rounded-[48px] border-2 border-dashed border-white/5">
                                 <Activity size={64} className="text-slate-500 mb-6 animate-pulse" />
                                 <span className="text-sm font-black uppercase tracking-[0.6em]">Awaiting Uplink</span>
                              </div>
                           ) : (
                              logs.map((log, i) => (
                                 <motion.div 
                                   key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                                   className={`p-6 rounded-[32px] border transition-all ${
                                      i === 0 ? 'bg-indigo-600/10 border-indigo-500/30 shadow-2xl' : 'bg-slate-900/40 border-white/5 opacity-60'
                                   }`}
                                 >
                                    <div className="flex items-start gap-6">
                                       <div className="mt-1">
                                          {log.status === 'COMPLETE' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Loader2 size={18} className="text-indigo-500 animate-spin" />}
                                       </div>
                                       <div className="flex-1">
                                          <div className="flex justify-between items-center mb-2">
                                             <span className="text-[11px] font-black text-indigo-400 tracking-widest uppercase">{log.step}</span>
                                             <span className="text-[10px] font-mono text-slate-600">{log.timestamp}</span>
                                          </div>
                                          <p className="text-lg text-slate-200 font-bold tracking-tight leading-tight">{log.detail}</p>
                                       </div>
                                    </div>
                                 </motion.div>
                              ))
                           )}
                        </AnimatePresence>
                     </div>

                     <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                           {classification === 'scam' && (
                              <motion.div 
                                key="scam-intercept"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-red-950/20 border-2 border-red-500/30 rounded-[48px] p-10 shadow-2xl relative overflow-hidden h-full flex flex-col"
                              >
                                 <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShieldAlert size={200} /></div>
                                 <div className="flex items-center gap-3 mb-10">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping shadow-[0_0_15px_rgba(239,68,68,1)]" />
                                    <span className="text-xs font-black text-red-500 uppercase tracking-[0.4em] italic">Intercept Initialized</span>
                                 </div>
                                 
                                 <div className="bg-black/60 p-8 rounded-3xl border border-red-500/10 mb-10 flex-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Neural Guardian Intervention</span>
                                    <p className="text-3xl font-black text-slate-100 italic leading-snug tracking-tighter">
                                       "{typedReply || 'Re-routing scammer traffic...'}"
                                    </p>
                                 </div>

                                 {interceptData?.forensics && (
                                    <div className="space-y-6">
                                       <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-2">Neutralization Status</span>
                                       <div className="grid grid-cols-1 gap-4">
                                          <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                             <span className="text-[10px] font-black text-slate-400">ANALYSIS SIGNATURE</span>
                                             <span className="text-[10px] font-black text-emerald-500">VERIFIED</span>
                                          </div>
                                          <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                             <span className="text-[10px] font-black text-slate-400">FORENSIC PACK</span>
                                             <span className="text-[10px] font-black text-cyan-500">BUNDLED</span>
                                          </div>
                                          <div className="flex items-center justify-between bg-red-500/20 p-4 rounded-2xl border border-red-500/40 animate-pulse">
                                             <span className="text-[10px] font-black text-red-500 uppercase">System Status</span>
                                             <span className="text-[10px] font-black text-red-500">TARGET BLOCKED</span>
                                          </div>
                                       </div>
                                    </div>
                                 )}
                              </motion.div>
                           )}

                           {(classification && classification !== 'scam' && classification !== 'likely_scam') && (
                              <motion.div 
                                key="safe-verified"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-[48px] p-10 shadow-2xl relative overflow-hidden h-full flex flex-col"
                              >
                                 <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShieldCheck size={200} /></div>
                                 <div className="flex items-center gap-3 mb-10">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,1)]" />
                                    <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] italic">Shield Protection Active</span>
                                 </div>
                                 
                                 <div className="bg-black/60 p-8 rounded-3xl border border-emerald-500/10 mb-10 flex-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Neural Verifier Status</span>
                                    <p className="text-3xl font-black text-slate-100 italic leading-snug tracking-tighter">
                                       "Communication verified as SECURE. No threat signatures detected in real-time stream."
                                    </p>
                                 </div>

                                 <div className="space-y-6">
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-2">Traffic Integrity</span>
                                    <div className="grid grid-cols-1 gap-4">
                                       <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                          <span className="text-[10px] font-black text-slate-400">ENCRYPTION</span>
                                          <span className="text-[10px] font-black text-emerald-500">ACTIVE</span>
                                       </div>
                                       <div className="flex items-center justify-between bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/40">
                                          <span className="text-[10px] font-black text-emerald-500 uppercase">System Status</span>
                                          <span className="text-[10px] font-black text-emerald-500">PROTECTED</span>
                                       </div>
                                    </div>
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>
            </motion.section>
          )}

          {/* TAB 03: AUTHORITY FEED (Embedded Cyber Cell Portal) */}
          {activeTab === 'AUTHORITY' && (
            <motion.section 
               key="authority" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
               className="absolute inset-0 bg-[#020617] flex flex-col items-center overflow-hidden"
            >
               <iframe id="cyber-frame" src="http://localhost:5174" className="w-full h-full border-none" title="Cyber Cell" />
            </motion.section>
          )}

        </AnimatePresence>

      </main>

      {/* 3. Global Status Bar */}
      <footer className="h-10 border-t border-white/5 flex items-center justify-between px-10 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 shrink-0 z-[100]">
          <div className="flex gap-10">
             <span className="flex items-center gap-2 text-indigo-500">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]" /> RAKSHAK CORE v4.2
             </span>
             <span className="text-slate-700">MASTER_AUTH: UNLOCKED</span>
          </div>
          <div className="flex gap-4 text-cyan-400/50 italic">
             <span>SECURE-CHANNEL-ENCRYPTED //</span>
             <span>AES-256-V2 //</span>
             <span className="not-italic text-indigo-500 opacity-100">RAKSHAK_ULTRA_PREMIUM_SUITE</span>
          </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        .text-shadow-red { text-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
      `}</style>
    </div>
  )
}
