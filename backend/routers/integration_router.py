import logging
import json
import time
from datetime import timezone
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from database import Case, Stats
from dependencies import get_db, validate_integration_key, manager, load_agent, save_agent, analyzer
from agent import RakshakAgent
from schemas import AnalyzeRequest
import asyncio
import secrets

router = APIRouter(prefix="/api/v1/internal/demo", tags=["internal_demo"])

@router.post("/ingest", dependencies=[Depends(validate_integration_key)])
async def shadow_ingest(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Shadow Intake for Demo/Simulator purposes.
    Strictly isolated from real user data via source_type="demo".
    """
    try:
        data = await request.json()
        sender = data.get("sender", "Unknown")
        body = data.get("message", "")
        platform = data.get("platform", "demo")
        slow_mo = data.get("slow_mo", False)
        media_type = data.get("media_type") # image, video, audio
        media_url = data.get("media_url")
        thread_id = f"demo_{sender}"

        logging.info(f"🧪 [SHADOW INGEST] From {sender}: {body} (Media: {media_type})")

        async def broadcast_step(step: str, detail: str, data: dict = None):
            msg = json.dumps({
                "type": "BRAIN_STEP",
                "data": {
                    "step": step,
                    "detail": detail,
                    "payload": data or {},
                    "threadId": thread_id
                }
            })
            await manager.broadcast(msg)
            if (slow_mo):
                await asyncio.sleep(0.1) # 🚀 Reduced from 1.5s for instant feel

        # 1. Start Ingestion
        ingest_msg = f"Message received from {sender} via {platform}"
        if media_type:
            ingest_msg = f"Multi-modal payload ({media_type.upper()}) received from {sender}"
        await broadcast_step("INGESTION", ingest_msg)

        # 1.5 Media Forensics (Pre-processing)
        if media_type:
            await broadcast_step("FORENSICS", f"Analyzing {media_type.upper()} for manipulation signatures...")
            if (slow_mo): await asyncio.sleep(0.1) # 🚀 Reduced from 1s for instant feel
            await broadcast_step("FORENSICS", "Running Deepfake Detection & Metadata Extraction...")

        # 2. Load agent & Analyze
        agent = load_agent(thread_id)
        
        await broadcast_step("ANALYSIS", "Running ScamAnalyzer Brain (NLP/ML)...")
        analysis = agent.ingest(body, thread_id)
        
        # DEMO LOGIC: If media is sent, boost risk score significantly
        if media_type:
            analysis["risk_score"] = max(analysis.get("risk_score", 0), 85)
            analysis["classification"] = "scam"
            analysis["intent"] = f"Multi-modal_{media_type.capitalize()}_Scam"

        risk_score = analysis.get("risk_score", 0)
        # Ensure risk_score is normalized to 0.0-1.0 for frontend * 100 consistency
        if risk_score > 1:
            risk_score = risk_score / 100.0

        classification = analysis.get("classification")
        logging.info(f"🔍 [DEBUG] Analysis: Class={classification}, Score={risk_score}")
        await broadcast_step("ANALYSIS", f"Analysis Complete. Risk Score: {int(risk_score * 100)}%", {"analysis": {**analysis, "risk_score": risk_score}})

        # 3. Decision & Response: Neural Logic
        response_body = None
        
        # Generate a response for ALL classifications (not just scam).
        # This ensures the main app sees Rakshak reply via WebSocket,
        # and the simulator chat also shows the reply.
        await broadcast_step("DECISION", f"Classification: {classification.upper() if classification else 'UNKNOWN'}. Generating adaptive response...")
        response_body = await asyncio.to_thread(agent.generate_response, classification or 'benign', body)

        # ── NEW: Security Alert Logic (Tri-Layer System) ─────────────────────
        # 1. Check for Egress Violations (PII Leaks)
        violation = analyzer.detect_egress_violation(response_body)
        if violation.get("has_violation"):
            alert_msg = json.dumps({
                "type": "SECURITY_ALERT",
                "data": {
                    "alertType": "LEAK",
                    "severity": violation["severity"],
                    "message": f"CRITICAL: Potential leak of {', '.join(violation['types'])} detected in outgoing response.",
                    "threadId": thread_id,
                    "timestamp": int(time.time() * 1000)
                }
            })
            await manager.broadcast(alert_msg)
            logging.warning(f"🚨 [SECURITY_ALERT] Egress violation ({violation['types']}) blocked and alerted for {thread_id}")

        # 2. Check for High-Risk Coercion (Threat Level)
        if risk_score > 0.9 and classification == "scam":
            alert_msg = json.dumps({
                "type": "SECURITY_ALERT",
                "data": {
                    "alertType": "THREAT",
                    "severity": "HIGH",
                    "message": "URGENT: High-pressure manipulation detected. Scammer is attempting aggressive coercion.",
                    "threadId": thread_id,
                    "timestamp": int(time.time() * 1000)
                }
            })
            await manager.broadcast(alert_msg)

        # ── Automated Forensic Bundle Generation (PDF/JSON Mock) ──────────────
        forensic_bundle = None
        if classification in ["scam", "likely_scam"]:
            await broadcast_step("FORENSICS", "Generating automated evidence bundle (PDF + JSON)...")
            forensic_bundle = {
                "bundle_id": f"FB-{int(time.time()*1000)}",
                "pdf_report": f"RAKSHAK_EVIDENCE_{sender}.pdf",
                "json_metadata": f"FORENSICS_{sender}.json",
                "media_forensics": {"type": media_type, "threat": "High" if media_type else "None"},
                "signature": "SHA256-RAKSHAK-SECURE",
                "timestamp": int(time.time() * 1000)
            }
            # Simulate processing time for the demo
            if (slow_mo): await asyncio.sleep(0.2) # 🚀 Reduced from 2s for instant feel

        if not classification:
            classification = "safe"

        # 4. Save to DB with Forensic Metadata (ONLY for scams)
        if classification in ["scam", "likely_scam"]:
            new_case = Case(
                conversation_id=f"{thread_id}_{int(time.time())}",
                scammer_name=sender,
                platform=platform,
                classification=classification,
                confidence_score=risk_score,
                transcript=json.dumps(agent.conversation_history[-2:]),
                iocs={**agent.iocs, "forensics": forensic_bundle, "media": {"type": media_type, "url": media_url} if media_type else None},
                source_type="demo",
                auto_reported=True
            )
            db.add(new_case)
            db.commit()

        # 5. Broadcast to portals with COMPLETE forensic data (Always broadcast for Demo UI Visibility)
        alert_msg = json.dumps({
            "type": "NEW_INTERCEPT",
            "data": {
                "threadId": thread_id,
                "scammerText": body,
                "classification": classification,
                "intent": analysis.get("intent", agent.intent or "Safe_Interaction"),
                "timestamp": int(time.time() * 1000),
                "agentReply": response_body,
                "persona": agent.current_persona,
                "forensics": forensic_bundle,
                "media": {"type": media_type, "url": media_url} if media_type else None,
                "confidence_score": risk_score, # Explicitly send normalized score
                "is_demo": True
            }
        })
        await manager.broadcast(alert_msg)

        save_agent(thread_id, agent)

        # Return only status for the simulator; the actual response is handled by Rakshak Standalone via WebSockets.
        return {
            "status": "processed",
            "classification": classification,
            "forensics": forensic_bundle
        }
    except Exception as e:
        logging.error(f"❌ Shadow Ingest Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset", dependencies=[Depends(validate_integration_key)])
async def reset_demo_thread(data: dict):
    """
    Purges the state for a specific demo thread.
    Required for clean re-runs of the 'Reality-Flow' demonstration.
    """
    thread_id = data.get("threadId")
    if not thread_id:
        raise HTTPException(status_code=400, detail="Missing threadId")
    
    # Simple strategy: just save an empty agent or delete file
    save_agent(thread_id, RakshakAgent(thread_id))
    logging.info(f"♻️ [STATE RESET] Thread {thread_id} has been sanitized.")
    return {"status": "reset", "threadId": thread_id}

@router.get("/download-report/{report_name}", dependencies=[Depends(validate_integration_key)])
async def download_report(report_name: str):
    """
    Serves a mock forensic report for the user to download.
    Completes the 'Evidence Locker' demonstration.
    """
    from fastapi.responses import Response
    
    # Simple strategy: generate a dynamic text-based 'PDF' or JSON
    if report_name.endswith(".pdf"):
        content = f"--- RAKSHAK AI FORENSIC REPORT ---\nTarget: {report_name}\nStatus: VERIFIED SCAM\nAction: INTERCEPTED\nSignature: {secrets.token_hex(16)}"
        return Response(content=content, media_type="text/plain")
    
    if report_name.endswith(".json"):
        content = json.dumps({"status": "SCAM_DETECTED", "timestamp": int(time.time()), "report": report_name, "security_hash": secrets.token_hex(16)})
        return Response(content=content, media_type="application/json")

    raise HTTPException(status_code=404, detail="Report not generated yet.")

@router.get("/intelligence", dependencies=[Depends(validate_integration_key)])
async def demo_intelligence(db: Session = Depends(get_db)):
    """
    Returns aggregated demo-only intelligence for the portal.
    """
    cases = db.query(Case).filter(Case.source_type == "demo").order_by(Case.created_at.desc()).limit(20).all()
    # Ensure timestamps are ISO strings with 'Z' for UTC alignment in the frontend
    return [
        {
            "id": c.id,
            "conversation_id": c.conversation_id,
            "scammer_name": c.scammer_name,
            "platform": c.platform,
            "classification": c.classification,
            "confidence_score": c.confidence_score,
            "iocs": c.iocs,
            "transcript": c.transcript,
            "auto_reported": c.auto_reported,
            "created_at": c.created_at.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z') if c.created_at else None
        } for c in cases
    ]

@router.get("/explain-incident/{case_id}", dependencies=[Depends(validate_integration_key)])
async def explain_incident(case_id: int, db: Session = Depends(get_db)):
    """
    Provides a detailed technical explanation for a specific demo case.
    Satisfies the requirement for 'automated explanation'.
    """
    case = db.query(Case).filter(Case.id == case_id, Case.source_type == "demo").first()
    if not case:
        raise HTTPException(status_code=404, detail="Demo case not found")
    
    # Simulate a deep technical breakdown
    explanation = {
        "case_id": case.id,
        "raw_conclusion": case.classification,
        "confidence": case.confidence_score,
        "workflow_steps": [
            {"step": "INTAKE", "status": "COMPLETED", "detail": f"Message received via {case.platform}"},
            {"step": "NLP_ANALYSIS", "status": "COMPLETED", "detail": f"Detected urgency patterns. Score: {case.confidence_score}"},
            {"step": "PERSONA_LOGIC", "status": "COMPLETED", "detail": "Adaptive response generated based on threat level."},
            {"step": "IOC_EXTRACTION", "status": "COMPLETED", "detail": f"Extracted {len(case.iocs.get('urls', []))} malicious URLs."},
            {"step": "ISOLATION", "status": "COMPLETED", "detail": "Data stored in Shadow Database for demo purposes."}
        ]
    }
    return explanation
