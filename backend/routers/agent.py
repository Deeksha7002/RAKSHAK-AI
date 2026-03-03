import logging
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from schemas import GenerateResponseRequest, AnalysisRequest
from dependencies import analyzer, load_agent, save_agent, get_current_user, manager, get_db

router = APIRouter(tags=["agent"])

@router.post("/api/generate-response")
async def generate_llm_response(
    payload: GenerateResponseRequest,
    request: Request,
    current_user: Optional[str] = Depends(get_current_user)
):
    """
    Called by the frontend demo to generate a Groq LLM-powered agent response.
    Uses the RakshakAgent's LLM logic and falls back gracefully if Groq is unavailable.
    """
    thread_id = request.headers.get("X-Thread-ID", "default-thread")
    agent = load_agent(thread_id, current_user)
    
    # Update agent state from history if provided
    if payload.conversation_history:
        agent.history = payload.conversation_history
    
    # Update latest classification signal
    if payload.classification:
        agent.last_analysis = {"classification": payload.classification}

    # Generate response
    response_text = await agent.generate_response(payload.message, persona=payload.persona)
    
    # Persist updated state
    save_agent(thread_id, agent, current_user)
    
    logging.info(f"🤖 Agent Response generated for thread {thread_id} (User: {current_user})")
    return {"message": response_text}

@router.post("/api/analyze")
async def analyze_text(payload: AnalysisRequest, request: Request):
    """Performs deep NLP analysis on a text snippet with heuristic fallback."""
    result = analyzer.analyze(payload.text, context=payload.context)
    return result

@router.websocket("/ws/intercept")
async def websocket_intercept(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
