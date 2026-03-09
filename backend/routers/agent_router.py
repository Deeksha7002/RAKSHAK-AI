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
async def analyze_text(payload: AnalysisRequest, request: Request):
    """Performs deep NLP analysis on a text snippet."""
    logging.info(f"🔍 [ANALYZER] Input received: '{payload.text[:50]}...'")
    result = analyzer.analyze(payload.text, context=payload.context, sender_name=payload.sender_name or "")
    logging.info(f"📊 [ANALYZER] Result: {result.get('classification')} | Intent: {result.get('intent')}")
    return result

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
