import { useState, useRef, useEffect } from 'react';
import { useThreads } from '../context/ThreadProvider';
import { soundManager } from '../lib/SoundManager';
import { MockScammerAPI } from '../lib/MockScammerAPI';
import { RakshakAgent } from '../lib/RakshakAgent';
import { IntelligenceService } from '../lib/IntelligenceService';
import { GeoTracer } from '../lib/GeoTracer';
import { ForensicsService } from '../lib/ForensicsService';
import { MediaLogService } from '../lib/MediaLogService';
import { Anonymizer } from '../lib/Anonymizer';
import { CyberCellService } from '../lib/CyberCellService';
import type { Message, Thread, CaseFile, Scenario } from '../lib/types';

export function useRakshakCore(isTourOpen: boolean = false, activeView: string = 'DASHBOARD') {
    const { threads, setThreads, clearThreads } = useThreads();
    const isTourOpenRef = useRef(isTourOpen);
    useEffect(() => {
        isTourOpenRef.current = isTourOpen;
    }, [isTourOpen]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [persistentCases, setPersistentCases] = useState<CaseFile[]>([]);

    const isMonitoringRef = useRef(false);
    const apiRef = useRef(new MockScammerAPI());
    const agentsRef = useRef<Map<string, RakshakAgent>>(new Map());
    const scammerProgressRef = useRef<Map<string, number>>(new Map());
    const threadsRef = useRef<Thread[]>([]);

    useEffect(() => {
        CyberCellService.getAllCases().then(cases => setPersistentCases(cases));
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        threadsRef.current = threads;
    }, [threads]);

    // WebSocket Logic with Exponential Backoff
    useEffect(() => {
        if (!isMonitoring) return;

        let ws: WebSocket | null = null;
        let reconnectTimeout: any = null;
        let reconnectCount = 0;

        const connect = () => {
            // Connect absolute to Render to bypass Vercel Proxy WebSocket 404 failures
            const wsUrl = 'wss://scam-defender-honeypot-1-fi61.onrender.com/api/ws';
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('🔗 WebSocket Connected to Rakshak AI Core');
                setNotification('🔗 SECURE UPLINK ESTABLISHED: LISTENING FOR LIVE THREATS');
                reconnectCount = 0; // Reset on success
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'NEW_INTERCEPT') {
                        handleLiveIntercept(data.data);
                    }
                } catch (e) {
                    console.error('WebSocket parsing error:', e);
                }
            };

            ws.onclose = () => {
                console.log('🔗 WebSocket Disconnected. Reconnecting...');
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
                const delay = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
                reconnectTimeout = setTimeout(() => {
                    reconnectCount++;
                    connect();
                }, delay);
            };

            ws.onerror = (err) => {
                console.error('WebSocket Error:', err);
                ws?.close();
            };
        };

        connect();

        return () => {
            if (ws) {
                ws.onclose = null; // Prevent reconnect on intentional unmount
                ws.close();
            }
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [isMonitoring]);

    const handleLiveIntercept = (data: any) => {
        const threadId = data.threadId;
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
                intent: data.intent,
                persona: data.persona || 'ELDERLY'
            };
            setThreads((prev: Thread[]) => [newThread, ...prev]);
            if (!isTourOpenRef.current) soundManager.playAlert();
        } else {
            setThreads((prev: Thread[]) => {
                const existing = prev.find(t => t.id === threadId);
                if (existing) {
                    const updated = { ...existing, persona: data.persona || existing.persona };
                    return [updated, ...prev.filter(t => t.id !== threadId)];
                }
                return prev;
            });
        }

        addMessageToThread(threadId, {
            id: `live-s-${data.timestamp}`,
            sender: 'scammer',
            senderName: data.threadId,
            content: data.scammerText,
            timestamp: data.timestamp,
            isRedacted: false
        });

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
        spawnThread();
        await new Promise(r => setTimeout(r, 1500));
        spawnThread();
        await new Promise(r => setTimeout(r, 2000));
        spawnThread();

        const spawnLoop = async () => {
            if (!isMonitoringRef.current) return;
            // Spontaneous simulation updates (Optimized 3-8s)
            const randomDelay = 3000 + Math.random() * 5000;
            await new Promise(r => setTimeout(r, randomDelay));
            if (isMonitoringRef.current) {
                spawnThread();
                spawnLoop();
            }
        };
        spawnLoop();
    };

    const triggerBotnetMode = async () => {
        if (!isMonitoringRef.current) startMonitoring();
        const botnetBatch = apiRef.current.generateBatch(50);
        for (let i = 0; i < botnetBatch.length; i++) {
            spawnBotnetThread(botnetBatch[i]);
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
        }
        if (!isTourOpenRef.current) soundManager.playAlert();
    };

    const spawnBotnetThread = (scenario: Scenario) => {
        const threadId = scenario.id;
        const agent = new RakshakAgent();
        agent.senderName = scenario.senderName;
        agent.detectedLocation = GeoTracer.trace(scenario.location);
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
        const agent = new RakshakAgent();
        agent.senderName = scenario.senderName;
        agent.detectedLocation = GeoTracer.trace(scenario.location);
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
        attachments?: any[],
        silent: boolean = false
    ) => {
        console.log(`%c🚨 [RakshakCore] handleIncomingMessage ENTER`, 'background: #222; color: #bada55', { threadId, sender, content: content.substring(0, 30), silent });
        const threadStateAtStart = threadsRef.current.find(t => t.id === threadId);
        if (threadStateAtStart?.isBlocked && sender !== 'system') {
             console.log(`%c⛔ [RakshakCore] Thread BLOCKED. Skipping.`, 'color: red', threadId);
             return;
        }

        addMessageToThread(threadId, {
            id: Math.random().toString(36),
            sender,
            senderName,
            content,
            timestamp: Date.now(),
            isRedacted: false,
            attachments
        });
        
        // 🚨 CRITICAL DEFENSE: Only messages from the 'scammer' should trigger analysis and responses
        if (sender !== 'scammer') {
             console.log(`%c🛑 [RakshakCore] Skipping Analysis for non-scammer: ${sender}`, 'color: gray');
             return;
        }

        if (sender === 'scammer') {
            if (!silent && !isTourOpenRef.current) soundManager.playNotification();

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
                        attachment.url = "";
                        attachment.isShredded = true;

                        CyberCellService.autoReport({
                            conversationId: threadId,
                            scammerName: senderName || 'Unknown',
                            platform: 'chat',
                            classification: 'scam',
                            scamType: 'OTHER',
                            timestamp: new Date().toISOString(),
                            confidenceScore: result.authenticityScore,
                            transcript: [],
                            iocs: { urls: [], domains: [], paymentMethods: [], sensitiveDataRedacted: 0 }
                        }).then(() => {
                            CyberCellService.getAllCases().then(setPersistentCases);
                        });
                        break;
                    }
                }
            }

            if (isMediaMalicious) {
                setNotification("🚨 FORENSICS ALERT: DEEPFAKE DETECTED. TERMINATING CONNECTION.");
                if (!isTourOpenRef.current) soundManager.playAlert();
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
                agent = new RakshakAgent();
                agent.senderName = senderName || threadStateAtStart?.senderName || 'Unknown';
                if (threadStateAtStart?.detectedLocation) {
                    agent.detectedLocation = threadStateAtStart.detectedLocation;
                }
                agentsRef.current.set(threadId, agent);
            }

            const scenario = scenarioId ? apiRef.current.getScenario(scenarioId) : undefined;
            const relationalContext = scenario?.relationalContext;
            
            // 1. Local Fallback Ingest (Immediate UI Feedback potential)
            const localResult = agent.ingest(content, threadId, relationalContext);
            
            // 2. Sync with Master Brain (Backend)
            let result = localResult;
            try {
                console.log(`%c🧠 [RakshakCore] Syncing with Backend... content:`, 'color: cyan', content.substring(0, 30));
                const synced = await agent.syncWithBackend(content, threadId, activeView);
                console.log(`%c🧠 [RakshakCore] Backend Sync SUCCESS`, 'color: green', { synced_score: synced.score, synced_class: synced.classification });
                // Backend result overrides local for better precision
                result = { 
                    ...localResult, 
                    classification: synced.classification, 
                    score: synced.score,
                    neuralMatrix: synced.neuralMatrix ?? localResult.neuralMatrix // Store neuralMatrix
                };
                setThreads(prev => prev.map(t =>
                    t.id === threadId
                        ? { ...t, threatScore: synced.score, classification: synced.classification, neuralMatrix: synced.neuralMatrix, neuralMatrixHistory: synced.neuralMatrixHistory, detectedLocation: synced.detectedLocation ?? t.detectedLocation }
                        : t
                ));
            } catch (e) {
                console.warn("[RakshakCore] Master Brain sync failed. Using local heuristics.", e);
            }

            const { classification, safeText, intent, score, isCompromised, autoReported, missionComplete, scamType, iocs } = result;

            if (classification === 'scam' || classification === 'likely_scam') {
                IntelligenceService.recordScam({
                    type: scamType,
                    senderName: senderName || 'Unknown Threat',
                    conversationId: threadId,
                    identifiers: iocs
                });
            }

            const threadState = threadsRef.current.find(t => t.id === threadId);
            const wasIntercepted = threadState?.isIntercepted || false;
            const isNewInterception = classification === 'scam' || classification === 'likely_scam';

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
            console.log(`%c🤔 [RakshakCore] Decision Check`, 'color: yellow', { isNewInterception, wasIntercepted, missionComplete, isBlocked: threadState?.isBlocked, shouldReply });

            setThreads((prev: Thread[]) => prev.map((t: Thread) => {
                if (t.id !== threadId) return t;
                if (!t.isIntercepted && isNewInterception && !silent) {
                    if (!isTourOpenRef.current) soundManager.playAlert();
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
                if (!isTourOpenRef.current) soundManager.playSuccess();
                setNotification(`Mission Complete: Scammer blocked for ${senderName || 'Unknown'}`);
            }

            if (autoReported && !threadState?.autoReported) {
                if (!isTourOpenRef.current) soundManager.playSuccess();
                setNotification(`🚨 AUTO-REPORTED: High threat detected from ${senderName || 'Unknown'}. Evidence securely transmitted to Cyber Cell.`);
            }

            if (shouldReply) {
                const effectiveClassification = (classification === 'benign') ? 'scam' : classification;
                console.log(`%c💬 [RakshakCore] TRIGGERING REPLY. Class: ${effectiveClassification}`);
                try {
                    const response = await agent.generateResponse(effectiveClassification, content, activeView);
                    console.log(`%c💬 [RakshakCore] Reply Generated:`, 'color: pink', response?.substring(0, 30));
                    if (response) {
                        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
                        handleIncomingMessage(threadId, response, 'agent', undefined, scenarioId, undefined, silent);

                        if (scenarioId) {
                            const currentStep = scammerProgressRef.current.get(threadId) || 1;
                            let reply = await apiRef.current.getReplyForScenario(scenarioId, currentStep);
                            if (reply) {
                                scammerProgressRef.current.set(threadId, currentStep + 1);
                                await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
                                handleIncomingMessage(threadId, reply, 'scammer', undefined, scenarioId, undefined, silent);
                            }
                        }
                    } else {
                         console.warn(`%c⚠️ [RakshakCore] generateResponse returned NULL/undefined!`, 'color: orange');
                    }
                } catch (err) {
                    console.error(`%c🔥 [RakshakCore] generateResponse CRASHED:`, 'color: red', err);
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
        const cases: CaseFile[] = [...persistentCases];
        threads.forEach((thread: Thread) => {
            if (cases.some(c => c.id === thread.id)) return;
            if (!thread.classification && !thread.isIntercepted) return;
            if (thread.classification === 'benign') return;
            let agent = agentsRef.current.get(thread.id);
            if (!agent) {
                agent = new RakshakAgent();
                agent.senderName = thread.senderName;
                if (thread.detectedLocation) {
                    agent.detectedLocation = thread.detectedLocation;
                }
                // 🧠 [DEFENSE SYNC] Re-ingest transcripts to rebuild Threat profile node flaws
                thread.messages.forEach((m: any) => {
                    if (m.sender === 'scammer') agent!.ingest(m.content, thread.id);
                });
            }
            if (!agent) return cases; // TypeScript safety node flaws
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
                autoReported: thread.autoReported,
                scamType: report.scamType
            });
        });
        return cases;
    };

    const stopMonitoring = () => {
        setIsMonitoring(false);
        isMonitoringRef.current = false;
        clearThreads();
    };

    return {
        threads,
        isMonitoring,
        notification,
        setNotification,
        persistentCases,
        setPersistentCases,
        startMonitoring,
        stopMonitoring,
        triggerBotnetMode,
        getCaseFiles,
        wsStatus: isMonitoring ? (notification?.includes('established') ? 'connected' : 'reconnecting') : 'idle'
    };
}
