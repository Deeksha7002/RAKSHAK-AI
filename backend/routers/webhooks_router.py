import logging
import json
import time
from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from database import Case, Stats
from dependencies import get_db, analyzer, manager
from utils import send_email_reply, send_sms_reply
from schemas import AnalyzeRequest

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

def get_or_create_stats(db: Session):
    # FIX #4: correct module name is stats_router, not stats
    from routers.stats_router import get_or_create_stats as _get_stats
    return _get_stats(db)

@router.post("/twilio", response_class=PlainTextResponse)
async def twilio_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Receives real SMS messages from Twilio.
    1. Sends the text to the NLP Analyzer.
    2. Generates a Honeypot response.
    3. Returns TwiML for Twilio to send the SMS back to the scammer.
    """
    logging.info(f"📲 Incoming SMS from {From}: {Body}")
    
    # 1. Analyze for risk — pass From number as sender_name so impersonation patterns fire
    analysis = analyzer.analyze(Body, context="sms", sender_name=From)
    risk_score = analysis.get("risk_score", 0)
    
    # 2. Broadcast to frontend
    alert_msg = json.dumps({
        "type": "NEW_INTERCEPT",
        "data": {
            "threadId": f"sms_{From}",
            "scammerText": Body,
            "classification": analysis.get("classification"),
            "intent": analysis.get("intent"),
            "timestamp": int(time.time() * 1000)
        }
    })
    await manager.broadcast(alert_msg)

    # 3. Simple Honeypot Logic (Static for now, can be LLM-powered)
    response_body = "I'm busy right now, but I can look into this later. Why is it urgent?"
    if risk_score > 0.7:
        response_body = "This sounds important. What do I need to do next to verify my account?"

    # 4. Save to DB
    new_case = Case(
        conversation_id=f"sms_{From}_{int(time.time())}",
        scammer_name=From,
        platform="sms",
        classification="scam" if risk_score > 0.5 else "safe",
        confidence_score=risk_score,
        transcript=[{"role": "scammer", "content": Body}, {"role": "agent", "content": response_body}],
        iocs={"phone": From}
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

@router.post("/sendgrid")
async def email_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives incoming emails from SendGrid Inbound Parse."""
    try:
        form_data = await request.form()
        sender = form_data.get("from", "Unknown")
        subject = form_data.get("subject", "No Subject")
        body = form_data.get("text", "")
        
        logging.info(f"📧 Incoming Email from {sender}: {subject}")

        # Analyze — combine sender display name + subject as context so
        # brand impersonation (e.g. "CoinBase Support") triggers instantly
        sender_name_ctx = f"{sender} {subject}".strip()
        analysis = analyzer.analyze(body, context="email", sender_name=sender_name_ctx)
        risk_score = analysis.get("risk_score", 0)

        # Broadcast
        alert_msg = json.dumps({
            "type": "NEW_INTERCEPT",
            "data": {
                "threadId": f"email_{sender}",
                "scammerText": body,
                "classification": analysis.get("classification"),
                "intent": analysis.get("intent"),
                "timestamp": int(time.time() * 1000)
            }
        })
        await manager.broadcast(alert_msg)

        # Reply if suspicious
        if risk_score > 0.4:
            reply_content = f"Re: {subject}\n\nThank you for the notification. I've received your email and will get back to you shortly."
            send_email_reply(sender, f"Re: {subject}", reply_content)

        return {"status": "processed"}
    except Exception as e:
        logging.error(f"❌ SendGrid Webhook Error: {e}")
        return {"status": "error", "detail": str(e)}
