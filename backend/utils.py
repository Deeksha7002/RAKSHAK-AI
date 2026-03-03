import os
import logging
import json
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client

# ── Email Utility ────────────────────────────────────────────────────────────
def send_email_reply(to_email: str, subject: str, content: str):
    """Dispatches an email reply via SendGrid."""
    sg_key = os.environ.get("SENDGRID_API_KEY")
    if not sg_key:
        logging.warning(f"⚠️ SENDGRID_API_KEY not set. Email to {to_email} skipped.")
        return

    message = Mail(
        from_email=os.environ.get("FROM_EMAIL", "alerts@rakshak-ai.com"),
        to_emails=to_email,
        subject=subject,
        plain_text_content=content
    )
    try:
        sg = SendGridAPIClient(sg_key)
        sg.send(message)
        logging.info(f"📧 Email sent to {to_email}")
    except Exception as e:
        logging.error(f"❌ Failed to send email: {e}")

# ── SMS Utility ─────────────────────────────────────────────────────────────
def send_sms_reply(to_phone: str, body: str):
    """Dispatches an SMS reply via Twilio API (fallback for stateful triggers)."""
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_phone = os.environ.get("TWILIO_PHONE_NUMBER")

    if not all([account_sid, auth_token, from_phone]):
        logging.warning(f"⚠️ Twilio credentials missing. SMS to {to_phone} skipped.")
        return

    try:
        client = Client(account_sid, auth_token)
        client.messages.create(body=body, from_=from_phone, to=to_phone)
        logging.info(f"📱 SMS sent to {to_phone}")
    except Exception as e:
        logging.error(f"❌ Failed to send SMS: {e}")
