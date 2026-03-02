import requests

WEBHOOK_URL = "http://localhost:8000/api/webhook/email"

print(f"🚀 Sending mock email payload to {WEBHOOK_URL}...")

payload = {
    "from": "CEO <urgent.ceo@secure-billing-corp.com>",
    "to": "finance-dept@company.com",
    "subject": "URGENT: Outstanding Invoice Payment Required",
    "text": "Hello, \n\nPlease process the attached invoice immediately. The vendor is threatening to cut off services if this is not paid by EOD.\n\nSend $5,000 USD via wire transfer to the account listed attached.\n\nRegards,\nThe CEO"
}

try:
    response = requests.post(WEBHOOK_URL, data=payload)
    print(f"✅ Response Status: {response.status_code}")
    print(f"✅ Response Body: {response.text}")
except Exception as e:
    print(f"❌ Failed to send request: {e}")
