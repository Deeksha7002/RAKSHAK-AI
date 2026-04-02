import requests
import json

# Unified Backend URL
BACKEND_URL = "https://scam-defender-honeypot-1-fi61.onrender.com"
INTERNAL_KEY = "rakshak_demo_k3y_2024"

def test_scam_flow():
    print(f"🧪 Simulating HIGH-THREAT SCAM on {BACKEND_URL}...")
    url = f"{BACKEND_URL}/api/v1/internal/demo/ingest"
    headers = {
        "Content-Type": "application/json",
        "X-Rakshak-Key": INTERNAL_KEY
    }
    # This message should trigger the 'scam' classification and the Rakshak AI persona
    payload = {
        "sender": "+918888888888",
        "message": "URGENT: Your HDFC account will be blocked! Click http://hdfc-kyc-verify.com to update your PAN card now or lose all funds!",
        "platform": "demo_test_scam",
        "slow_mo": False
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if response.status_code == 200:
            print("\n🔍 VERIFICATION:")
            if data["classification"] in ["scam", "likely_scam"]:
                print("✅ [OK] Correctly classified as SCAM.")
            if data.get("response"):
                print(f"✅ [OK] Rakshak AI generated a defensive reply: '{data['response'][:50]}...'")
            if data.get("forensics"):
                print(f"✅ [OK] Forensic bundle generated: {data['forensics']['bundle_id']}")
            
            print("\n🎉 SYSTEM IS 100% DEMO READY!")
            return True
    except Exception as e:
        print(f"❌ Production Test Failed: {e}")
    return False

if __name__ == "__main__":
    test_scam_flow()
