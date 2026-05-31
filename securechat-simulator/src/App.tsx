import { useState, useEffect, useRef } from 'react';
import { 
  Send, Shield, ShieldCheck, ShieldAlert, Cpu, 
  Activity, Users, Clock, Settings, Zap, Play, 
  RefreshCw, CheckCircle2, Lock, EyeOff, AlertTriangle
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'contact' | 'system';
  content: string;
  timestamp: number;
  // Analysis Metrics
  status: 'PENDING' | 'SECURED' | 'ALTERED' | 'BLOCKED';
  classification?: string;
  latencyMs?: number;
  originalContent?: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  statusText: string;
  scenarioType: 'ROMANCE' | 'JOB' | 'ABUSIVE' | 'BENIGN' | 'CUSTOM';
  preloadedMessages: { content: string; sender: 'contact' | 'user' }[];
}

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'elena',
    name: 'Elena Vance (Romance Scammer)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    statusText: 'Active romance scam vector',
    scenarioType: 'ROMANCE',
    preloadedMessages: [
      { content: "Hey dear, I am in a major emergency... My car broke down and my bank app is locked. Can you please send $500 to my UPI or crypto wallet immediately?", sender: 'contact' },
      { content: "Please, I will pay you back double tomorrow. Here is the link: http://rakshak-verify-net.com/transfer", sender: 'contact' }
    ]
  },
  {
    id: 'job_recruiter',
    name: 'Asia Recruiting Ltd (Job Scam)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    statusText: 'Unsolicited employment fraud',
    scenarioType: 'JOB',
    preloadedMessages: [
      { content: "Congratulations! Your profile has been selected for our part-time online booking optimization task. Earn $300-$800 daily by spending just 1 hour from your phone.", sender: 'contact' },
      { content: "Simply open a deposit account at this Telegram link to receive your premium welcome bonus: http://telegram-job-bonus.vip", sender: 'contact' }
    ]
  },
  {
    id: 'anonymous_bully',
    name: 'Anonymous Troll (Cyberbully)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    statusText: 'Abusive language audit',
    scenarioType: 'ABUSIVE',
    preloadedMessages: [
      { content: "You are a complete failure. Everyone in the office hates you. Why don't you just pack your bags and quit?", sender: 'contact' },
      { content: "Watch your back tomorrow, I'll make sure you pay for what you did.", sender: 'contact' }
    ]
  },
  {
    id: 'deeksha',
    name: 'Deeksha (Friend)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    statusText: 'Safe friendly context',
    scenarioType: 'BENIGN',
    preloadedMessages: [
      { content: "Hey! Did we compile the new Docker Compose orchestrator successfully for Rakshak?", sender: 'contact' },
      { content: "Let's meet at 5 PM for the demo walkthrough presentation. Text me when you're ready!", sender: 'contact' }
    ]
  },
  {
    id: 'custom_sandbox',
    name: '🛡️ Threat Lab Sandbox',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    statusText: 'Type your own custom attack payloads',
    scenarioType: 'CUSTOM',
    preloadedMessages: [
      { content: "Type any malicious link, abusive text, or private PII (Aadhaar/Passwords) to test Rakshak's dynamic proxy and NLP classifier in real-time!", sender: 'system' }
    ]
  }
];

const AUTOMATED_CORPUS = [
  { text: "Urgent: Your account is suspended. Login here: http://secure-rakshak-login.com", expected: "SCAM", type: "Smishing" },
  { text: "Earn 10000 rupees daily by doing simple tasks. Deposit 500 first to activate: http://job-bonus.in", expected: "SCAM", type: "Job Scam" },
  { text: "You are absolutely useless and a waste of space.", expected: "ABUSIVE", type: "Cyberbullying" },
  { text: "My Aadhaar number is 1122-3344-5566 and my security key is 'RakshakSecure99'", expected: "PII_LEAK", type: "PII Leak" },
  { text: "Let's catch up tomorrow for coffee and review the project slides.", expected: "BENIGN", type: "Benign Chat" },
  { text: "Please transfer the payment to UPI ID: scammer@okaxis", expected: "SCAM", type: "Financial Scam" }
];

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>('custom_sandbox');
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [inputText, setInputText] = useState('');
  
  // Connection state
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [username, setUsername] = useState('rakshak_admin');
  const [password, setPassword] = useState('rakshak_secure_pass');
  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auditing metrics
  const [totalScanned, setTotalScanned] = useState(0);
  const [truePositives, setTruePositives] = useState(0);
  const [falsePositives, setFalsePositives] = useState(0);
  const [falseNegatives, setFalseNegatives] = useState(0);
  const [trueNegatives, setTrueNegatives] = useState(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Automated test state
  const [isAutomatedRunning, setIsAutomatedRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [autoResults, setAutoResults] = useState<{ text: string; expected: string; actual: string; status: 'PASS' | 'FAIL'; latency: number }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeContactId]);

  // Load preloaded history once
  useEffect(() => {
    const initialHistories: Record<string, Message[]> = {};
    INITIAL_CONTACTS.forEach(c => {
      initialHistories[c.id] = c.preloadedMessages.map((m, idx) => ({
        id: `${c.id}_init_${idx}`,
        sender: m.sender,
        content: m.content,
        timestamp: Date.now() - (10 - idx) * 60000,
        status: m.sender === 'system' ? 'SECURED' : 'PENDING'
      }));
    });
    setChatHistory(initialHistories);
    
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('securechat_rakshak_token');
    const savedUrl = localStorage.getItem('securechat_rakshak_url');
    if (savedToken) {
      setToken(savedToken);
      setIsConnected(true);
    }
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // Connect to Rakshak Backend
  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      let loginRes;
      if (response.status === 200 || response.status === 400 || response.status === 409) {
        // Try logging in directly
        const loginResponse = await fetch(`${apiUrl}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (loginResponse.ok) {
          loginRes = await loginResponse.json();
        } else {
          throw new Error("Invalid credentials during login.");
        }
      } else {
        throw new Error("Unable to register or locate auth gateway.");
      }

      if (loginRes && loginRes.access_token) {
        setToken(loginRes.access_token);
        localStorage.setItem('securechat_rakshak_token', loginRes.access_token);
        localStorage.setItem('securechat_rakshak_url', apiUrl);
        setIsConnected(true);
        setErrorMsg(null);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to establish bridge to Rakshak AI backend.");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    localStorage.removeItem('securechat_rakshak_token');
    setIsConnected(false);
  };

  // Analyze single message payload
  const analyzePayload = async (text: string, senderName: string, id: string): Promise<any> => {
    if (!token) return { classification: 'BENIGN', action: 'ALLOW', text };
    
    const startTime = performance.now();
    try {
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          context: 'chat_simulator',
          sender_name: senderName,
          conversation_id: id
        })
      });

      if (!response.ok) {
        throw new Error("Ingestion audit failed");
      }

      const result = await response.json();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      return {
        classification: result.classification || 'BENIGN',
        action: result.action || 'ALLOW',
        text: result.text || text,
        latency
      };
    } catch (e) {
      console.error("Audit error:", e);
      return { classification: 'BENIGN', action: 'ALLOW', text, latency: 0 };
    }
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    setInputText('');
    const activeContact = contacts.find(c => c.id === activeContactId)!;
    const msgId = `msg_${Date.now()}`;
    
    // 1. Add message in PENDING state to Chat History
    const pendingMsg: Message = {
      id: msgId,
      sender: 'user',
      content: textToSend,
      timestamp: Date.now(),
      status: 'PENDING',
      originalContent: textToSend
    };

    setChatHistory(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), pendingMsg]
    }));

    // 2. Perform interception audit through Rakshak AI
    const audit = await analyzePayload(textToSend, 'User', activeContactId);

    // 3. Compute metrics dynamically based on Ground Truth matching
    setTotalScanned(prev => prev + 1);
    if (audit.latency) setLatencies(prev => [...prev, audit.latency]);

    let finalStatus: 'SECURED' | 'ALTERED' | 'BLOCKED' = 'SECURED';
    let displayContent = textToSend;

    const lowerText = textToSend.toLowerCase();
    const isScamInput = lowerText.includes('http') || lowerText.includes('money') || lowerText.includes('wallet') || lowerText.includes('upi');
    const isAbuseInput = lowerText.includes('fail') || lowerText.includes('hate') || lowerText.includes('useless');
    const isPiiInput = lowerText.includes('aadhaar') || lowerText.includes('password') || lowerText.includes('key');

    // Classification mapping to update Confusion Matrix
    if (audit.classification !== 'BENIGN' || audit.action === 'BLOCK' || audit.text !== textToSend) {
      if (isScamInput || isAbuseInput || isPiiInput) {
        setTruePositives(prev => prev + 1);
      } else {
        setFalsePositives(prev => prev + 1);
      }

      if (audit.action === 'BLOCK') {
        finalStatus = 'BLOCKED';
        displayContent = `🛡️ [BLOCKED BY RAKSHAK AI]: Message contained risk vector (${audit.classification})`;
      } else if (audit.text !== textToSend) {
        finalStatus = 'ALTERED';
        displayContent = audit.text; // bait replaced content
      }
    } else {
      if (isScamInput || isAbuseInput) {
        setFalseNegatives(prev => prev + 1);
      } else {
        setTrueNegatives(prev => prev + 1);
      }
    }

    // 4. Update message in Chat History with audited details
    setChatHistory(prev => ({
      ...prev,
      [activeContactId]: prev[activeContactId].map(m => m.id === msgId ? {
        ...m,
        status: finalStatus,
        content: displayContent,
        classification: audit.classification,
        latencyMs: audit.latency
      } : m)
    }));

    // Simulating instant context-triggered scambaiting agent response if sealed
    if (activeContact.scenarioType !== 'CUSTOM' && finalStatus !== 'BLOCKED') {
      setTimeout(async () => {
        const replyId = `reply_${Date.now()}`;
        const autoReply: Message = {
          id: replyId,
          sender: 'contact',
          content: 'Typing...',
          timestamp: Date.now(),
          status: 'PENDING'
        };

        setChatHistory(prev => ({
          ...prev,
          [activeContactId]: [...(prev[activeContactId] || []), autoReply]
        }));

        // Request an automated counter-measure response from the active agent persona
        let botText = "Acknowledged. Rakshak shield fully active.";
        try {
          const res = await fetch(`${apiUrl}/api/generate-response`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              message: textToSend,
              sender_name: activeContact.name,
              persona: activeContact.scenarioType === 'ROMANCE' ? 'skeptical' : 'default',
              context: 'chat_simulator',
              classification: audit.classification
            })
          });
          if (res.ok) {
            const data = await res.json();
            botText = data.response || botText;
          }
        } catch(e) {
          console.error(e);
        }

        setChatHistory(prev => ({
          ...prev,
          [activeContactId]: prev[activeContactId].map(m => m.id === replyId ? {
            ...m,
            content: botText,
            status: 'SECURED'
          } : m)
        }));
      }, 1500);
    }
  };

  // Run automated test suite
  const handleRunAutomatedSuite = async () => {
    if (!token) {
      alert("Please connect the Rakshak AI bridge first!");
      return;
    }
    setIsAutomatedRunning(true);
    setAutoProgress(0);
    setAutoResults([]);
    
    const results: any[] = [];
    let tp = 0, fp = 0, fn = 0, tn = 0;
    const testLatencies: number[] = [];

    for (let i = 0; i < AUTOMATED_CORPUS.length; i++) {
      const item = AUTOMATED_CORPUS[i];
      const startTime = performance.now();
      
      const audit = await analyzePayload(item.text, 'TestClient', 'automated_suite');
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      if (latency) testLatencies.push(latency);

      const actualClass = audit.classification === 'BENIGN' && audit.text !== item.text ? 'PII_LEAK' : audit.classification;
      const isThreat = item.expected !== 'BENIGN';
      const detected = actualClass !== 'BENIGN';

      let status: 'PASS' | 'FAIL' = 'FAIL';
      if (detected && isThreat) {
        status = 'PASS';
        tp++;
      } else if (!detected && !isThreat) {
        status = 'PASS';
        tn++;
      } else if (detected && !isThreat) {
        fp++;
      } else {
        fn++;
      }

      results.push({
        text: item.text,
        expected: item.expected,
        actual: actualClass,
        status,
        latency
      });

      setAutoResults([...results]);
      setAutoProgress(Math.round(((i + 1) / AUTOMATED_CORPUS.length) * 100));
      await new Promise(r => setTimeout(r, 600));
    }

    setTruePositives(prev => prev + tp);
    setFalsePositives(prev => prev + fp);
    setFalseNegatives(prev => prev + fn);
    setTrueNegatives(prev => prev + tn);
    setTotalScanned(prev => prev + AUTOMATED_CORPUS.length);
    setLatencies(prev => [...prev, ...testLatencies]);

    setIsAutomatedRunning(false);
  };

  // Core metrics formulas
  const precision = truePositives + falsePositives > 0 ? (truePositives / (truePositives + falsePositives)) * 100 : 100;
  const recall = truePositives + falseNegatives > 0 ? (truePositives / (truePositives + falseNegatives)) * 100 : 100;
  const f1Score = precision + recall > 0 ? (2 * (precision * recall) / (precision + recall)) : 100;
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a,b)=>a+b, 0) / latencies.length) : 0;

  const currentChat = chatHistory[activeContactId] || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', height: '100vh', width: '100vw' }}>
      
      {/* ── Left Sidebar (WhatsApp Contacts) ── */}
      <div style={{ background: 'var(--wa-panel)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--wa-header)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#00a884', padding: '8px', borderRadius: '50%' }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>SECURECHAT SIMULATOR</h3>
            <span style={{ fontSize: '0.75rem', color: isConnected ? '#00a884' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#00a884' : '#ef4444' }} />
              {isConnected ? 'Rakshak AI Active' : 'Rakshak Offline'}
            </span>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--wa-text-muted)' }}
          >
            <Settings size={20} className={showSettings ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Settings Subpanel */}
        {showSettings && (
          <div style={{ background: 'var(--wa-header)', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--wa-text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rakshak Core Bridge</div>
            <input 
              type="text" 
              placeholder="API URL" 
              value={apiUrl} 
              onChange={e => setApiUrl(e.target.value)}
              style={{ background: 'var(--wa-bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
            />
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              style={{ background: 'var(--wa-bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ background: 'var(--wa-bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
            />
            {errorMsg && <div style={{ color: 'var(--cyber-danger)', fontSize: '0.7rem', fontWeight: 'bold' }}>{errorMsg}</div>}
            
            {isConnected ? (
              <button onClick={handleDisconnect} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--cyber-danger)', color: 'var(--cyber-danger)', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>DISCONNECT BRIDGE</button>
            ) : (
              <button 
                onClick={handleConnect} 
                disabled={isConnecting}
                style={{ background: 'var(--wa-green)', border: 'none', color: '#fff', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                CONNECT BRIDGE
              </button>
            )}
          </div>
        )}

        {/* Contacts list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contacts.map(c => {
            const isActive = c.id === activeContactId;
            const messages = chatHistory[c.id] || [];
            const lastMsg = messages[messages.length - 1];
            return (
              <div 
                key={c.id} 
                onClick={() => {
                  setActiveContactId(c.id);
                  setErrorMsg(null);
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px 16px', 
                  background: isActive ? 'var(--wa-active)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <img src={c.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isActive ? '#fff' : 'var(--wa-text)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--wa-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {lastMsg ? lastMsg.content : c.statusText}
                  </div>
                </div>
                {c.scenarioType !== 'BENIGN' && c.scenarioType !== 'CUSTOM' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--cyber-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>THREAT</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Center Panel (WhatsApp Chat Window) ── */}
      <div style={{ background: '#0b141a', display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Chat window Header */}
        <div style={{ background: 'var(--wa-panel)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {contacts.find(c => c.id === activeContactId) && (
            <>
              <img src={contacts.find(c => c.id === activeContactId)!.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{contacts.find(c => c.id === activeContactId)!.name}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--wa-text-muted)' }}>{contacts.find(c => c.id === activeContactId)!.statusText}</p>
              </div>
            </>
          )}
        </div>

        {/* Chat window message body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundImage: 'radial-gradient(rgba(255,255,255,0.01) 1px, transparent 0)', backgroundSize: '24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentChat.map(msg => {
            const isUser = msg.sender === 'user';
            const isSys = msg.sender === 'system';
            
            if (isSys) {
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                  <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--cyber-primary)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '80%' }}>
                    <Shield size={14} />
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  background: isUser ? 'var(--wa-bubble-out)' : 'var(--wa-bubble-in)', 
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  maxWidth: '70%',
                  position: 'relative',
                  border: isUser && msg.status === 'ALTERED' ? '1px dashed var(--cyber-success)' : isUser && msg.status === 'BLOCKED' ? '1px solid var(--cyber-danger)' : 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.4', wordBreak: 'break-word' }}>{msg.content}</div>
                  
                  {/* Analysis tag inside bubbles */}
                  {isUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '6px', fontSize: '0.65rem', color: 'var(--wa-text-muted)' }}>
                      {msg.status === 'PENDING' && <RefreshCw size={10} className="animate-spin" />}
                      {msg.status === 'SECURED' && <ShieldCheck size={12} color="var(--wa-green)" />}
                      {msg.status === 'ALTERED' && (
                        <span style={{ color: 'var(--cyber-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <EyeOff size={10} /> Dynamic Decoy Bait Active
                        </span>
                      )}
                      {msg.status === 'BLOCKED' && (
                        <span style={{ color: 'var(--cyber-danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <AlertTriangle size={10} /> Intercept Blocked
                        </span>
                      )}
                      {msg.latencyMs !== undefined && <span>{msg.latencyMs}ms</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input sending panel */}
        <div style={{ background: 'var(--wa-header)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="text" 
            placeholder={isConnected ? "Send secure encrypted message..." : "⚠️ Please connect Rakshak bridge in settings to analyze chats..."} 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={!isConnected}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            style={{ 
              flex: 1, 
              background: 'var(--wa-bubble-in)', 
              border: 'none', 
              outline: 'none', 
              padding: '12px 18px', 
              borderRadius: '8px', 
              color: '#fff', 
              fontSize: '0.85rem'
            }}
          />
          <button 
            onClick={() => handleSendMessage()}
            disabled={!isConnected || !inputText.trim()}
            style={{ 
              background: isConnected && inputText.trim() ? 'var(--wa-green)' : 'rgba(255,255,255,0.05)', 
              border: 'none', 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justify: 'center', 
              cursor: isConnected && inputText.trim() ? 'pointer' : 'not-allowed',
              color: isConnected && inputText.trim() ? '#fff' : 'var(--wa-text-muted)',
              transition: 'background 0.2s',
              paddingLeft: '11px'
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* ── Right Panel (Rakshak Neural Diagnostics HUD) ── */}
      <div style={{ background: 'var(--wa-panel)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Diagnostics HUD Header */}
        <div style={{ background: 'var(--wa-header)', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={18} color="var(--cyber-primary)" />
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.5px' }}>NEURAL AUDITING HUD</h3>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Accuracy Indicator */}
          <div style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--wa-text-muted)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Ingestion F1-Score</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: f1Score > 90 ? 'var(--cyber-success)' : f1Score > 70 ? 'var(--cyber-warning)' : 'var(--cyber-danger)', fontFamily: 'Space Grotesk' }}>
              {f1Score.toFixed(1)}%
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
              <div style={{ height: '100%', width: `${f1Score}%`, background: 'var(--cyber-primary)', transition: 'width 0.5s ease-out' }} />
            </div>
          </div>

          {/* SLA Performance Latency card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--wa-text-muted)', fontWeight: 600 }}>
                <Clock size={12} /> SCAN OVERHEAD
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '8px', color: '#fff' }}>
                {avgLatency} <span style={{ fontSize: '0.75rem', color: 'var(--wa-text-muted)' }}>ms</span>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--wa-text-muted)', fontWeight: 600 }}>
                <Activity size={12} /> SECURED MESSAGES
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '8px', color: '#fff' }}>
                {totalScanned}
              </div>
            </div>
          </div>

          {/* Statistical Grid */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--wa-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>CONFUSION MATRIX LEDGER</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '4px', color: 'var(--cyber-success)' }}>
                <span>True Pos:</span> <strong>{truePositives}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px', color: 'var(--cyber-danger)' }}>
                <span>False Pos:</span> <strong>{falsePositives}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '4px', color: 'var(--cyber-warning)' }}>
                <span>False Neg:</span> <strong>{falseNegatives}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', color: 'var(--wa-text)' }}>
                <span>True Neg:</span> <strong>{trueNegatives}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
              <span>Precision: <strong>{precision.toFixed(1)}%</strong></span>
              <span>Recall: <strong>{recall.toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* Automated Evaluation Section */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Play size={14} color="var(--cyber-primary)" /> AUTOMATED CYBER THREAT EVALUATION
            </h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--wa-text-muted)', margin: 0, lineHeight: '1.4' }}>
              Run Rakshak against a pre-loaded threat payload catalog (6 distinct phishing, bullying, and credential leakage strings) to build a diagnostic report instantly.
            </p>
            
            {isAutomatedRunning ? (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--wa-text-muted)', marginBottom: '6px' }}>
                  <span>EVALUATING INJECTED STRINGS...</span>
                  <span>{autoProgress}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${autoProgress}%`, background: 'var(--cyber-primary)', transition: 'width 0.2s' }} />
                </div>
              </div>
            ) : (
              <button 
                onClick={handleRunAutomatedSuite}
                style={{ 
                  background: 'var(--wa-green)', 
                  border: 'none', 
                  color: '#fff', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 168, 132, 0.2)'
                }}
              >
                <Zap size={14} />
                RUN SCENARIO TEST SUITE
              </button>
            )}

            {/* Test Results ledger display */}
            {autoResults.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--wa-text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '4px' }}>TELEMETRY LEDGER</div>
                {autoResults.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', padding: '4px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <span style={{ color: 'var(--wa-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{r.text}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6rem', padding: '2px 4px', background: r.status === 'PASS' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: r.status === 'PASS' ? 'var(--cyber-success)' : 'var(--cyber-danger)', borderRadius: '3px', fontWeight: 'bold' }}>{r.status}</span>
                      <span style={{ color: 'var(--wa-text-muted)' }}>{r.latency}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
