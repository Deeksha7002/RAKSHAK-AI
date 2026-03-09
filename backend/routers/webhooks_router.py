import logging
import json
import time
from fastapi import APIRouter, Depends, Request, Form
import os
import asyncio
from twilio.request_validator import RequestValidator
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from database import Case, Stats
import os
from twilio.request_validator import RequestValidator
from dependencies import get_db, analyzer, manager, load_agent, save_agent
from utils import send_email_reply, send_sms_reply
from schemas import AnalyzeRequest
from agent import RakshakAgent

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

def get_or_create_stats(db: Session):
    # FIX #4: correct module name is stats_router, not stats
    from routers.stats_router import get_or_create_stats as _get_stats
    return _get_stats(db)

async def verify_twilio(request: Request):
    """Optional Twilio signature verification."""
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    if not auth_token:
        # logging.warning("⚠️ [SECURITY] TWILIO_AUTH_TOKEN not set. Skipping verification.")
        return True
    
    validator = RequestValidator(auth_token)
    signature = request.headers.get("X-Twilio-Signature")
    if not signature:
        logging.error("🚨 [SECURITY] Twilio signature missing!")
        return False
        
    url = str(request.url)
    form_data = await request.form()
    
    # Twilio validator expects a dict of form parameters
    if validator.validate(url, dict(form_data), signature):
        return True
    
    logging.error("🚨 [SECURITY] Twilio signature validation failed!")
    return False

@router.post("/twilio", response_class=PlainTextResponse)
async def twilio_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Receives real SMS messages from Twilio.
    1. Verifies Twilio signature (if token set).
    2. Loads/Creates a RakshakAgent for this sender.
    3. Ingests message and generates a persona-based response.
    4. Returns TwiML for Twilio to send the SMS back.
    """
    if not await verify_twilio(request):
        return PlainTextResponse("Forbidden", status_code=403)

    logging.info(f"📲 Incoming SMS from {From}: {Body}")
    thread_id = f"sms_{From}"
    
    # 1. Load agent and ingest
    agent = load_agent(thread_id)
    analysis = agent.ingest(Body, thread_id)
    risk_score = analysis.get("risk_score", 0)
    
    # 2. Broadcast to frontend
    alert_msg = json.dumps({
        "type": "NEW_INTERCEPT",
        "data": {
            "threadId": thread_id,
            "scammerText": Body,
            "classification": analysis.get("classification"),
            "intent": analysis.get("intent"),
            "timestamp": int(time.time() * 1000)
        }
    })
    await manager.broadcast(alert_msg)

    # 3. Generate adaptive response
    response_body = await asyncio.to_thread(agent.generate_response, analysis.get("classification"), Body)
    if not response_body:
        response_body = "I'm busy right now, but I can look into this later. Why is it urgent?"
    
    # Save agent state (especially for LLM context etc.)
    save_agent(thread_id, agent)

    # 4. Save Case to DB for visibility in Evidence Locker
    new_case = Case(
        conversation_id=f"{thread_id}_{int(time.time())}",
        scammer_name=From,
        platform="sms",
        classification=analysis.get("classification"),
        confidence_score=risk_score,
        transcript=agent.conversation_history[-2:], # Just last turn for DB summary
        iocs={"phone": From, **agent.iocs}
    )
    db.add(new_case)
    
    # Update Stats
    stats = get_or_create_stats(db)
    stats.total_intercepted += 1
    if new_case.classification == "scam":
        stats.scams_prevented += 1
    
    db.commit()

    # 5. Return TwiML
    return f"<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>{response_body}</Message></Response>"

async def verify_sendgrid(request: Request):
    """Optional SendGrid signature verification."""
    # SendGrid uses a specific 'X-Twilio-Email-Auth-Token' or similar if configured via Twilio,
    # or manual verification via public key. For this implementation, we allow an optional
    # fixed verification token as a simple shared secret for Inbound Parse.
    verify_token = os.environ.get("SENDGRID_VERIFICATION_TOKEN")
    if not verify_token:
        return True
    
    # Basic check against a custom header or query param
    # SendGrid Inbound Parse can be configured to include custom headers
    incoming_token = request.headers.get("X-Rakshak-Webhook-Token")
    if incoming_token == verify_token:
        return True
    
    logging.error("🚨 [SECURITY] SendGrid webhook token verification failed!")
    return False

@router.post("/sendgrid")
async def email_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives incoming emails from SendGrid Inbound Parse."""
    if not await verify_sendgrid(request):
        from fastapi.responses import JSONResponse
        return JSONResponse({"status": "forbidden"}, status_code=403)
        
    try:
        form_data = await request.form()
        sender = form_data.get("from", "Unknown")
        subject = form_data.get("subject", "No Subject")
        body = form_data.get("text", "")
        
        logging.info(f"📧 Incoming Email from {sender}: {subject}")
        thread_id = f"email_{sender}"

        # 1. Load agent and ingest
        # Combine sender + subject for context
        ctx_body = f"Subject: {subject}\n\n{body}"
        agent = load_agent(thread_id)
        analysis = agent.ingest(ctx_body, thread_id)
        risk_score = analysis.get("risk_score", 0)

        # 2. Broadcast
        alert_msg = json.dumps({
            "type": "NEW_INTERCEPT",
            "data": {
                "threadId": thread_id,
                "scammerText": body,
                "classification": analysis.get("classification"),
                "intent": analysis.get("intent"),
                "timestamp": int(time.time() * 1000)
            }
        })
        await manager.broadcast(alert_msg)

        # 3. Generate adaptive reply if suspicious
        if risk_score > 0.4:
            reply_content = await asyncio.to_thread(agent.generate_response, analysis.get("classification"), ctx_body)
            if not reply_content:
                reply_content = f"Re: {subject}\n\nThank you for the notification. I've received your email and will get back to you shortly."
            
            send_email_reply(sender, f"Re: {subject}", reply_content)
            save_agent(thread_id, agent)

        return {"status": "processed"}
    except Exception as e:
        logging.error(f"❌ SendGrid Webhook Error: {e}")
        return {"status": "error", "detail": str(e)}
