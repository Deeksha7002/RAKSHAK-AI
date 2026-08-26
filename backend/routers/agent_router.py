import logging
import json
import hashlib
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from schemas import GenerateResponseRequest, AnalysisRequest
from dependencies import analyzer, load_agent, save_agent, get_current_user, manager, get_db
from agent import RakshakAgent

router = APIRouter(tags=["agent"])

@router.get("/api/debug/headers")
async def debug_headers(request: Request):
    """Returns the raw headers sent to the backend."""
    return dict(request.headers)

@router.get("/api/debug/auth_logs")
async def debug_auth_logs():
    from config import AUTH_LOGS
    return AUTH_LOGS

@router.post("/api/generate-response")
async def generate_llm_response(
    payload: GenerateResponseRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Generates a persona-driven agent response using the logic class.
    """
    # Create or load a thread based on the message content and sender
    thread_key = f"{payload.sender_name}:{payload.message}"
    thread_id = hashlib.sha256(thread_key.encode()).hexdigest()[:12]
    agent = load_agent(thread_id, current_user)

    # Sync history from frontend if it exists
    if payload.conversation_history:
        agent.conversation_history = payload.conversation_history

    # Sync requested persona from frontend
    if payload.persona:
        agent.current_persona = payload.persona

    # Run blocking Groq I/O in a thread pool so we don't block the event loop
    response_text = await asyncio.to_thread(agent.generate_response, payload.classification, payload.message, payload.context)

    # Persist updated state
    save_agent(thread_id, agent, current_user)

    logging.info(f"🤖 [ROUTER] Agent Response generated for thread: {thread_id}")
    return {"response": response_text, "persona": agent.current_persona}

@router.post("/api/analyze")
async def analyze_text(payload: AnalysisRequest, current_user: str = Depends(get_current_user)):
    """Performs deep stateful analysis using the RakshakAgent brain."""
    if not current_user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Authentication required")
        
    thread_id = payload.conversation_id or "default"
    agent = load_agent(thread_id, current_user)
    
    logging.info(f"🔍 [AGENT-CORE] Analyzing for thread {thread_id}: '{payload.text[:50]}...'")
    
    # Run ingestion (stateful NLP) in thread pool
    result = await asyncio.to_thread(agent.ingest, payload.text, thread_id, payload.context)
    
    # Persist updated state (Persona might have switched!)
    save_agent(thread_id, agent, current_user)
    
    # Merge result with current agent state for the frontend
    return {
        **result,
        "current_persona": agent.current_persona,
        "thread_id": thread_id,
        "detected_location": agent.detected_location
    }

@router.websocket("/api/ws")
async def websocket_intercept(websocket: WebSocket):
    """WebSocket endpoint for real-time scam interception alerts."""
    await manager.connect(websocket)
    try:
        while True:
            # We mostly broadcast *to* clients, but keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket Error: {e}")
        manager.disconnect(websocket)

@router.post("/api/scan/universal")
async def citizen_universal_scan(payload: AnalysisRequest):
    """
    Public citizen scam scanner endpoint.
    Performs fast NLP intent classification, PII sanitization, and returns
    a simple citizen verdict (SAFE, CAREFUL, SCAM) with confidence and red flags.
    """
    text = payload.text.strip()
    score, category, matrix, llm_needed = analyzer.analyze_behavior([{"role": "scammer", "content": text}])
    
    verdict = "SAFE"
    confidence = int(score * 100)
    
    if score >= 0.6:
        verdict = "SCAM"
    elif score >= 0.3:
        verdict = "CAREFUL"
        
    explanation = "No major scam indicators detected."
    if verdict == "SCAM":
        explanation = f"This content contains high-risk scam indicators associated with {category.replace('_', ' ')} fraud."
    elif verdict == "CAREFUL":
        explanation = "This content uses urgent or suspicious language. Exercise caution."

    red_flags = []
    if "bit.ly" in text.lower() or "xyz" in text.lower() or "http" in text.lower():
        red_flags.append("Contains unverified web link")
    if "urgent" in text.lower() or "immediately" in text.lower() or "disconnect" in text.lower():
        red_flags.append("Uses artificial urgency or coercion tactics")
    if "kyc" in text.lower() or "otp" in text.lower() or "bank" in text.lower():
        red_flags.append("Requests sensitive credentials or banking update")

    return {
        "verdict": verdict,
        "confidence": max(15, min(99, confidence)),
        "category": category,
        "explanation": explanation,
        "red_flags": red_flags,
        "timestamp": payload.context
    }
