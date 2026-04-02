import requests
import json

# Unified Backend URL
BACKEND_URL = "https://scam-defender-honeypot-1-fi61.onrender.com"
INTERNAL_KEY = "rakshak_demo_k3y_2024"

def test_shadow_ingest():
    print(f"🧪 Testing Production Shadow Ingest on {BACKEND_URL}...")
    url = f"{BACKEND_URL}/api/v1/internal/demo/ingest"
    headers = {
        "Content-Type": "application/json",
        "X-Rakshak-Key": INTERNAL_KEY
    }
    payload = {
        "sender": "+1234567890",
        "message": "URGENT: This is a production health check test of the Rakshak AI ecosystem.",
        "platform": "production_test"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200:
            print("✅ Production Shadow Ingest Success!")
            return True
    except Exception as e:
        print(f"❌ Production Test Failed: {e}")
    return False

if __name__ == "__main__":
    print("🚀 Starting Production Integration Verification...")
    test_shadow_ingest()
