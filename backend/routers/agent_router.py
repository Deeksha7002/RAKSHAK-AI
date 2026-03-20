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
    # FIX #3: current_user is already the username string, not a dict
    agent = load_agent(thread_id, current_user)

    # Sync history from frontend if it exists
    if payload.conversation_history:
        agent.conversation_history = payload.conversation_history

    # FIX #2: Run blocking Groq I/O in a thread pool so we don't block the event loop
    response_text = await asyncio.to_thread(agent.generate_response, payload.classification, payload.message)

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
    result = await asyncio.to_thread(agent.ingest, payload.text, thread_id)
    
    # Persist updated state (Persona might have switched!)
    save_agent(thread_id, agent, current_user)
    
    # Merge result with current agent state for the frontend
    return {
        **result,
        "current_persona": agent.current_persona,
        "thread_id": thread_id,
        "detected_location": agent.detected_location
    }

# FIX #1: WebSocket path changed to /api/ws to match what the frontend expects
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
