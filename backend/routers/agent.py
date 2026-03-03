import logging
import json
import hashlib
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
    current_user: dict = Depends(get_current_user)
):
    """
    Generates a persona-driven agent response using the logic class.
    """
    # Create or load a thread based on the message content (or use X-Thread-ID if found)
    thread_id = hashlib.sha256(payload.message.encode()).hexdigest()[:12]
    agent = load_agent(thread_id, current_user["sub"])
    
    # Sync history from frontend if it exists
    if payload.conversation_history:
        agent.conversation_history = payload.conversation_history
    
    # Generate the response via the logic class
    response_text = agent.generate_response(payload.classification, payload.message)
    
    # Persist updated state
    save_agent(thread_id, agent, current_user["sub"])
    
    logging.info(f"🤖 [ROUTER] Agent Response generated for thread: {thread_id}")
    return {"response": response_text, "persona": agent.current_persona}

@router.post("/api/analyze")
async def analyze_text(payload: AnalysisRequest, request: Request):
    """Performs deep NLP analysis on a text snippet."""
    result = analyzer.analyze(payload.text, context=payload.context)
    return result

@router.websocket("/ws/intercept")
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
