import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { InboxList } from './components/InboxList';
import { LoginScreen } from './components/LoginScreen';
import { LockScreen } from './components/LockScreen';
import { SystemDashboard } from './components/SystemDashboard';
import { LiveIntercept } from './components/LiveIntercept';
import { MockScammerAPI } from './lib/MockScammerAPI';
import { HoneypotAgent } from './lib/HoneypotAgent';
import { IntelligenceService } from './lib/IntelligenceService';
import { IntelligenceReport } from './components/IntelligenceReport';
import { soundManager } from './lib/SoundManager';
import { GeoTracer } from './lib/GeoTracer';
import { DemoConsole } from './components/DemoConsole';
import { Play, Database, Volume2, VolumeX, ShieldAlert, LogOut, BarChart3, ScanEye, Shield, Zap, ChevronLeft } from 'lucide-react';
import { DeepfakeAnalyzer } from './components/DeepfakeAnalyzer';
import { ForensicsService } from './lib/ForensicsService';
import { MediaLogService } from './lib/MediaLogService';
import { Anonymizer } from './lib/Anonymizer';
import { CyberCellService } from './lib/CyberCellService';
import { useAuth } from './context/AuthContext';
import { useThreads } from './context/ThreadProvider';
import type { Message, Thread, CaseFile, Scenario } from './lib/types';
import { API_BASE_URL } from './lib/config';
import './index.css';

const EvidenceLocker = lazy(() => import('./components/EvidenceLocker').then(module => ({ default: module.EvidenceLocker })));

type ViewState = 'DASHBOARD' | 'LOCKER' | 'FORENSICS' | 'INTELLIGENCE' | 'DEMO';

function App() {
  const { threads, setThreads, clearThreads } = useThreads();
  const { isAuthenticated, logout } = useAuth();

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);
  const [persistentCases, setPersistentCases] = useState<CaseFile[]>([]);

  useEffect(() => {
    // Load persistent cases on boot
    CyberCellService.getAllCases().then(cases => setPersistentCases(cases));
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const isMonitoringRef = useRef(false);
  const apiRef = useRef(new MockScammerAPI());
  const agentsRef = useRef<Map<string, HoneypotAgent>>(new Map());
  const scammerProgressRef = useRef<Map<string, number>>(new Map());
  const threadsRef = useRef<Thread[]>([]);

  // --- Live WebSocket Connection ---
  useEffect(() => {
    if (!isMonitoring) return;

    // Connect to WebSocket using the backend API URL
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/api/ws';

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔗 WebSocket Connected to Cyber Cell Core');
      setNotification('🔗 SECURE UPLINK ESTABLISHED: LISTENING FOR LIVE THREATS');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_INTERCEPT') {
          handleLiveIntercept(data);
        }
      } catch (e) {
        console.error('WebSocket parsing error:', e);
      }
    };

    ws.onclose = () => {
      console.log('🔗 WebSocket Disconnected');
    };

    return () => {
      ws.close();
    };
  }, [isMonitoring]);

  const handleLiveIntercept = (data: any) => {
    const threadId = data.threadId;

    // Check if thread exists
    const existingThread = threadsRef.current.find(t => t.id === threadId);

    if (!existingThread) {
      const newThread: Thread = {
        id: threadId,
        scenarioId: 'LIVE',
        senderName: data.threadId,
        source: 'sms',
        messages: [],
        classification: data.classification,
        isIntercepted: true,
        isScanning: false,
        location: "Unknown",
        detectedLocation: { country: "Unknown", city: "Unknown", lat: 0, lng: 0, ip: "0.0.0.0", isp: "Carrier" },
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.threadId}`,
        isCompromised: false,
        isArchived: false,
        intent: data.intent
      };
      setThreads((prev: Thread[]) => [newThread, ...prev]);
      soundManager.playAlert();
    }

    // Add Scammer Message
    addMessageToThread(threadId, {
      id: `live-s-${data.timestamp}`,
      sender: 'scammer',
      senderName: data.threadId,
      content: data.scammerText,
      timestamp: data.timestamp,
      isRedacted: false
    });

    // Add Agent Reply
    if (data.agentReply) {
      setTimeout(() => {
        addMessageToThread(threadId, {
          id: `live-a-${data.timestamp}`,
          sender: 'agent',
          content: data.agentReply,
          timestamp: data.timestamp + 500,
          isRedacted: false
        });
      }, 1000);
    }
  };

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const startMonitoring = () => {
    if (isMonitoringRef.current) return;
    setIsMonitoring(true);
    isMonitoringRef.current = true;
    setThreads([]);
    agentsRef.current.clear();
    scammerProgressRef.current.clear();
    simulateIncomingTraffic();
  };

  const simulateIncomingTraffic = async () => {
    if (!isMonitoringRef.current) return;

    // Initial burst
    spawnThread();
    await new Promise(r => setTimeout(r, 1500));
    spawnThread();
    await new Promise(r => setTimeout(r, 2000));
    spawnThread();

    // Continuous trickle
    const spawnLoop = async () => {
      if (!isMonitoringRef.current) return;

      const randomDelay = 8000 + Math.random() * 15000; // 8-23 seconds
      await new Promise(r => setTimeout(r, randomDelay));

      if (isMonitoringRef.current) {
        spawnThread();
        spawnLoop(); // Recursive loop
      }
    };

    spawnLoop();
  };

  // Botnet Simulation Mode
  const triggerBotnetMode = async () => {
    if (!isMonitoringRef.current) startMonitoring();
    const botnetBatch = apiRef.current.generateBatch(50);
    for (let i = 0; i < botnetBatch.length; i++) {
      spawnBotnetThread(botnetBatch[i]);
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 100)); // Slight stagger
    }
    soundManager.playAlert(); // Major alert
  };

  const spawnBotnetThread = (scenario: Scenario) => {
    const threadId = scenario.id;
    const agent = new HoneypotAgent();
    agentsRef.current.set(threadId, agent);
    scammerProgressRef.current.set(threadId, 1);

    const newThread: Thread = {
      id: threadId,
      scenarioId: scenario.id,
      senderName: scenario.senderName,
      source: scenario.source,
      messages: [],
      classification: null,
      isIntercepted: scenario.type === 'scam',
      isScanning: false,
      location: scenario.location,
      detectedLocation: GeoTracer.trace(scenario.location),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${scenario.senderName}`,
      isCompromised: false,
      isArchived: false
    };

    setThreads((prev: Thread[]) => [newThread, ...prev]);
    const initialMsg = scenario.messages[0];
    handleIncomingMessage(threadId, initialMsg, 'scammer', scenario.senderName, scenario.id, scenario.attachments, true);
  };

  const spawnThread = () => {
    if (!isMonitoringRef.current) return;
    const scenario = apiRef.current.getRandomScenario();
    const threadId = Math.random().toString(36).substring(7);
    const agent = new HoneypotAgent();
    agentsRef.current.set(threadId, agent);
    scammerProgressRef.current.set(threadId, 1);

    const newThread: Thread = {
      id: threadId,
      scenarioId: scenario.id,
      senderName: scenario.senderName,
      source: scenario.source,
      messages: [],
      classification: null,
      isIntercepted: false,
      isScanning: true,
      location: scenario.location,
      detectedLocation: GeoTracer.trace(scenario.location),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${scenario.senderName}`,
      isCompromised: false,
      isArchived: false
    };

    setThreads((prev: Thread[]) => [...prev, newThread]);
    const initialMsg = scenario.messages[0];
    handleIncomingMessage(threadId, initialMsg, 'scammer', scenario.senderName, scenario.id, scenario.attachments);
  };

  const handleIncomingMessage = async (
    threadId: string,
    content: string,
    sender: 'scammer' | 'agent' | 'system',
    senderName?: string,
    scenarioId?: string,
    attachments?: any[], // Using any[] for brevity in replacement, will map to MediaType properly
    silent: boolean = false
  ) => {
    const threadStateAtStart = threadsRef.current.find(t => t.id === threadId);
    if (threadStateAtStart?.isBlocked && sender !== 'system') return;

    addMessageToThread(threadId, {
      id: Math.random().toString(36),
      sender,
      senderName,
      content,
      timestamp: Date.now(),
      isRedacted: false,
      attachments
    });

    if (sender === 'scammer') {
      if (!silent) soundManager.playNotification();

      // AUTOMATED FORENSICS CHECK
      let isMediaMalicious = false;
      if (attachments && attachments.length > 0) {
        setNotification("🔍 AUTOMATED FORENSICS: Analyzing incoming media...");

        for (const attachment of attachments) {
          const result = await ForensicsService.analyzeAutomated(Anonymizer.sanitizeFilename(attachment.name), attachment.type);
          const isFake = result.recommendation.includes('Manipulated') || result.authenticityScore < 40;

          MediaLogService.addLog({
            id: `log-${Date.now()}-${Math.random()}`,
            senderId: Anonymizer.anonymize(threadId),
            senderName: Anonymizer.anonymize(senderName || 'Unknown'),
            mediaType: attachment.type,
            confidence: result.confidenceLevel,
            action: isFake ? 'BLOCKED' : 'STORED',
            timestamp: Date.now(),
            result
          });

          if (isFake) {
            isMediaMalicious = true;
            attachment.url = ""; // Shredded
            attachment.isShredded = true;

            CyberCellService.autoReport({
              conversationId: threadId,
              scammerName: senderName || 'Unknown',
              platform: 'chat',
              classification: 'scam',
              timestamp: new Date().toISOString(),
              confidenceScore: result.authenticityScore,
              transcript: [],
              iocs: {
                urls: [],
                domains: [],
                paymentMethods: [],
                sensitiveDataRedacted: 0
              }
            }).then(() => {
              // Refresh persistent cases after report
              CyberCellService.getAllCases().then(setPersistentCases);
            });

            console.warn(`%c[Shredder] ☢️ AUTOMATED DESTRUCTION COMPLETE`, 'color: #ef4444; font-weight: bold;');
            break;
          }
        }
      }

      if (isMediaMalicious) {
        setNotification("🚨 FORENSICS ALERT: DEEPFAKE DETECTED. TERMINATING CONNECTION.");
        soundManager.playAlert();
        setThreads((prev: Thread[]) => prev.map(t => t.id === threadId ? { ...t, isBlocked: true, classification: 'scam' } : t));
        addMessageToThread(threadId, {
          id: `block-auto-${Date.now()}`,
          sender: 'system',
          content: "🛡️ AUTOMATED DEFENSE: Deepfake/Synthetic media detected. Evidence preserved and forwarded to Cyber Cell. Sender has been permanently blocked.",
          timestamp: Date.now()
        });
        return;
      }

      await new Promise(r => setTimeout(r, 1200 + Math.random() * 500));

      let agent = agentsRef.current.get(threadId);
      if (!agent) {
        agent = new HoneypotAgent();
        agentsRef.current.set(threadId, agent);
      }

      const scenario = scenarioId ? apiRef.current.getScenario(scenarioId) : undefined;
      const relationalContext = scenario?.relationalContext;
      const { classification, safeText, intent, score, isCompromised, autoReported, missionComplete, scamType, iocs } = agent.ingest(content, threadId, relationalContext);

      if (classification === 'scam' || classification === 'likely_scam') {
        IntelligenceService.recordScam({
          type: scamType,
          senderName: senderName || 'Unknown Threat',
          conversationId: threadId,
          identifiers: iocs
        });
      }

      // 🛡️ DYNAMIC LIVE INTERCEPTION MEAUSRES 🛡️
      const threadState = threadsRef.current.find(t => t.id === threadId);
      const wasIntercepted = threadState?.isIntercepted || false;
      const isNewInterception = classification === 'scam' || classification === 'likely_scam';

      // If we just intercepted this or the intent escalated, fire a counter-measure log
      if (isNewInterception && intent !== threadState?.intent) {
        let counterMsg = "";
        if (intent === "MONEY") counterMsg = "🛡️ DEFENSE SYSTEM: Tracing payment routing. Simulated Crypto Wallet generated and injected.";
        else if (intent === "CODES") counterMsg = "🛡️ DEFENSE SYSTEM: OTP Interception detected. Injecting mathematically invalid decoy codes.";
        else if (intent === "URGENCY") counterMsg = "🛡️ DEFENSE SYSTEM: High-pressure semantics detected. Activating AI stalling protocols.";

        if (counterMsg) {
          addMessageToThread(threadId, {
            id: `cm-${Date.now()}`,
            sender: 'system',
            content: counterMsg,
            timestamp: Date.now()
          });
        }
      }

      const shouldReply = (isNewInterception || wasIntercepted) && !missionComplete && !threadState?.isBlocked;

      setThreads((prev: Thread[]) => prev.map((t: Thread) => {
        if (t.id !== threadId) return t;
        if (!t.isIntercepted && isNewInterception && !silent) {
          soundManager.playAlert();
        }
        return {
          ...t,
          classification,
          isIntercepted: shouldReply || (missionComplete && t.isIntercepted),
          isScanning: false,
          isBlocked: missionComplete || t.isBlocked,
          persona: agent!.currentPersona,
          intent,
          threatScore: score,
          isCompromised: isCompromised || t.isCompromised,
          autoReported: autoReported || t.autoReported,
          messages: t.messages.map((m: Message, idx: number) => {
            if (idx === t.messages.length - 1 && m.sender === 'scammer') {
              return { ...m, content: safeText, isRedacted: safeText !== content };
            }
            return m;
          })
        };
      }));

      if (missionComplete && !threadState?.isBlocked) {
        addMessageToThread(threadId, {
          id: `block-${Date.now()}`,
          sender: 'system',
          content: "🛡️ INTELLIGENCE CAPTURED: All necessary credentials obtained. Connection terminated. Scammer has been blocked from further contact.",
          timestamp: Date.now()
        });
        soundManager.playSuccess();
        setNotification(`Mission Complete: Scammer blocked for ${senderName || 'Unknown'}`);
      }

      if (autoReported && !threadState?.autoReported) {
        const isCompromise = isCompromised || threadState?.isCompromised;
        const alertPrefix = isCompromise ? "🚩 COMPROMISE ALERT" : "🚨 AUTO-REPORTED";
        const alertMsg = isCompromise
          ? `Known contact ${senderName || 'Unknown'} appears compromised. Behavior anomaly reported to Cyber Cell.`
          : `High threat detected from ${senderName || 'Unknown'}. Evidence securely transmitted to Cyber Cell.`;

        setNotification(`${alertPrefix}: ${alertMsg}`);
        soundManager.playSuccess();
      }

      if (shouldReply) {
        const effectiveClassification = (classification === 'benign') ? 'scam' : classification;
        const response = agent.generateResponse(effectiveClassification, content);
        if (response) {
          await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
          handleIncomingMessage(threadId, response, 'agent', undefined, scenarioId, undefined, silent);

          if (scenarioId) {
            const currentStep = scammerProgressRef.current.get(threadId) || 1;
            let reply = await apiRef.current.getReplyForScenario(scenarioId, currentStep);
            if (!reply) reply = "What did you say?";

            if (reply) {
              scammerProgressRef.current.set(threadId, currentStep + 1);
              await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
              try {
                handleIncomingMessage(threadId, reply, 'scammer', undefined, scenarioId, undefined, silent);
              } catch (e) {
                console.error("Recursion error:", e);
              }
            }
          }
        }
      }
    }
  };

  const addMessageToThread = (threadId: string, msg: Message) => {
    setThreads((prev: Thread[]) => prev.map((t: Thread) => {
      if (t.id === threadId) {
        return { ...t, messages: [...t.messages, msg] };
      }
      return t;
    }));
  };

  const getCaseFiles = (): CaseFile[] => {
    // Start with persistent cases from backend
    const cases: CaseFile[] = [...persistentCases];

    // Add live threads that aren't yet persisted
    threads.forEach((thread: Thread) => {
      // Skip if already in persistent list
      if (cases.some(c => c.id === thread.id)) return;

      if (!thread.classification && !thread.isIntercepted) return;
      if (thread.classification === 'benign') return;
      const agent = agentsRef.current.get(thread.id);
      if (!agent) return;
      const report = agent.getReport(thread.id, thread.classification || 'likely_scam', thread.messages);
      cases.push({
        id: thread.id,
        scammerName: thread.senderName,
        platform: thread.source,
        status: thread.isArchived ? 'closed' : 'active',
        threatLevel: thread.classification || 'likely_scam',
        iocs: report.iocs,
        transcript: thread.messages,
        timestamp: new Date(report.timestamp).toLocaleDateString(),
        detectedLocation: thread.detectedLocation,
        autoReported: thread.autoReported
      });
    });
    return cases;
  };


  const selectedThread = threads.find(t => t.id === selectedThreadId);
  const [isLocked, setIsLocked] = useState(false);

  if (!isAuthenticated) return <LoginScreen />;
  if (isLocked) return <LockScreen onUnlock={() => setIsLocked(false)} />;

  return (
    <>
      {notification && (
        <div className="notification-toast">
          <Shield className="shrink-0" size={20} />
          {notification}
        </div>
      )}

      <div className="messenger-container" data-mobile-view={selectedThreadId ? 'chat' : 'list'}>
        {/* Sidebar */}
        <div className="sidebar">
          <InboxList
            threads={threads.map((t: Thread) => ({
              id: t.id,
              senderName: t.senderName,
              source: t.source,
              lastMessage: t.messages[t.messages.length - 1]?.content || '',
              classification: t.classification,
              isIntercepted: t.isIntercepted,
              persona: t.persona,
              autoReported: t.autoReported,
              isCompromised: t.isCompromised,
              isBlocked: t.isBlocked
            }))}
            selectedThreadId={selectedThreadId}
            onSelectThread={(id) => {
              if (id === 'DASHBOARD_VIEW') {
                setSelectedThreadId(null);
                setActiveView('DASHBOARD');
              } else {
                setSelectedThreadId(id);
                // When selecting a thread, we implicitly move away from dashboard/tools
                // but we don't strictly set activeView to specific tool, just defaults back when thread cleared
              }
            }}
            onBack={() => {
              setSelectedThreadId(null);
              setActiveView('DASHBOARD');
            }}
          />

          {/* Control Footer */}
          <div className="control-footer">
            {!isMonitoring ? (
              <button onClick={startMonitoring} className="btn btn-primary" style={{ width: '100%' }}>
                <Play size={20} /> <span className="btn-text">INITIALIZE SYSTEM</span>
              </button>
            ) : (
              <div className="control-grid">
                <button
                  onClick={() => { setActiveView('LOCKER'); setSelectedThreadId(null); }}
                  className={`btn btn-icon ${activeView === 'LOCKER' && !selectedThreadId ? 'active' : ''}`}
                  title="Intelligence Locker"
                >
                  <Database size={20} />
                </button>
                <button
                  onClick={() => { setActiveView('FORENSICS'); setSelectedThreadId(null); }}
                  className={`btn btn-icon ${activeView === 'FORENSICS' && !selectedThreadId ? 'active' : ''}`}
                  title="Forensics Lab"
                >
                  <ScanEye size={20} />
                </button>
                <button
                  onClick={() => { setActiveView('INTELLIGENCE'); setSelectedThreadId(null); }}
                  className={`btn btn-icon ${activeView === 'INTELLIGENCE' && !selectedThreadId ? 'active' : ''}`}
                  title="Monitor Intelligence"
                >
                  <BarChart3 size={20} />
                </button>
                <button
                  onClick={() => { setActiveView('DEMO'); setSelectedThreadId(null); }}
                  className={`btn btn-icon ${activeView === 'DEMO' && !selectedThreadId ? 'active' : ''}`}
                  title="Test Lab (Demo Mode)"
                >
                  <Zap size={20} />
                </button>
                <button
                  onClick={() => setIsMuted(soundManager.toggleMute())}
                  className={`btn btn-icon ${isMuted ? 'muted' : ''}`}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button
                  onClick={() => {
                    logout();
                    clearThreads();
                    setSelectedThreadId(null);
                    setIsMonitoring(false);
                    isMonitoringRef.current = false;
                    setActiveView('DASHBOARD');
                  }}
                  className="btn btn-icon btn-danger"
                  title="Terminate Session"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-chat">
          {selectedThreadId && selectedThread ? (
            <>
              {/* CHAT VIEW - Takes specific logic for thread display */}
              <div className="chat-banner" data-status={
                selectedThread.classification === 'scam' || selectedThread.classification === 'likely_scam' ? 'scam' :
                  selectedThread.classification === 'benign' ? 'safe' : 'neutral'
              }>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    className="mobile-back-btn"
                    onClick={() => { setSelectedThreadId(null); setActiveView('DASHBOARD'); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'none', // Default hidden, shown via media query in index.css
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div>
                    <div className="sender-name">{selectedThread.senderName}</div>
                    <div className="sender-source">{selectedThread.source}</div>
                  </div>
                </div>
                <div>
                  {selectedThread.isScanning && <span className="status-scanning">Scanning...</span>}
                  {selectedThread.classification === 'benign' && <span className="status-safe">✓ Verified Safe</span>}
                  {selectedThread.autoReported && (
                    <span className="status-reported">
                      AUTO-REPORTED TO CYBER CELL ✅
                    </span>
                  )}
                </div>
              </div>

              {selectedThread.isCompromised && (
                <div className="compromise-alert-banner">
                  <div className="compromise-alert-content">
                    <div style={{ background: 'var(--status-danger)', color: 'white', padding: '4px', borderRadius: '4px' }}>
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <div className="compromise-alert-title">KNOWN CONTACT COMPROMISED</div>
                      <div className="compromise-alert-desc">Behavior anomaly detected for {selectedThread.senderName}.</div>
                    </div>
                  </div>
                  <button onClick={() => { setActiveView('LOCKER'); setSelectedThreadId(null); }} className="btn-danger-glow compromise-alert-btn">
                    REPORT COMPROMISE
                  </button>
                </div>
              )}

              {selectedThread.isIntercepted && (
                <LiveIntercept
                  intent={selectedThread.intent || "ANALYZING..."}
                  threatScore={selectedThread.threatScore || 0}
                  isScanning={selectedThread.isScanning}
                  location={selectedThread.detectedLocation}
                  counterMeasure={
                    selectedThread.intent === "MONEY" ? "TRACE_PAYMENT" :
                      selectedThread.intent === "CODES" ? "INJECT_FAKE_OTP" :
                        selectedThread.intent === "URGENCY" ? "STALLING_PROTOCOL" : "MONITORING"
                  }
                />
              )}

              <div className="chat-viewport">
                <ChatWindow messages={selectedThread.messages} />
              </div>
            </>
          ) : (
            // NOT IN CHAT - Render based on Active View
            <>
              {activeView === 'LOCKER' && (
                <Suspense fallback={<div>Loading Secure Module...</div>}>
                  <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-secondary)' }}>
                      <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>EVIDENCE LOCKER</h2>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <EvidenceLocker cases={getCaseFiles()} onClose={() => setActiveView('DASHBOARD')} />
                    </div>
                  </div>
                </Suspense>
              )}

              {activeView === 'FORENSICS' && (
                <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-secondary)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>FORENSICS LAB</h2>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DeepfakeAnalyzer />
                  </div>
                </div>
              )}

              {activeView === 'INTELLIGENCE' && (
                <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-secondary)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>INTELLIGENCE MONITOR</h2>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                    <IntelligenceReport />
                  </div>
                </div>
              )}

              {activeView === 'DEMO' && (
                <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-secondary)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>TEST LAB / DEMO</h2>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <DemoConsole />
                  </div>
                </div>
              )}

              {activeView === 'DASHBOARD' && (
                <SystemDashboard
                  activeThreats={threads.filter(t => t.classification === 'scam' || t.classification === 'likely_scam').length}
                  locations={threads.filter(t => (t.classification === 'scam' || t.classification === 'likely_scam') && t.detectedLocation).map(t => t.detectedLocation!)}
                  onSimulateAttack={triggerBotnetMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
