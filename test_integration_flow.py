import requests
import json
import os

# Configuration
BACKEND_URL = "http://localhost:8000"
INTERNAL_KEY = "rakshak_demo_k3y_2024"

def test_shadow_ingest():
    print("🧪 Testing Shadow Ingest...")
    url = f"{BACKEND_URL}/api/v1/internal/demo/ingest"
    headers = {
        "Content-Type": "application/json",
        "X-Rakshak-Key": INTERNAL_KEY
    }
    payload = {
        "sender": "+1234567890",
        "message": "URGENT: Your account has been hacked! Click here: http://scam.py",
        "platform": "demo_test"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        assert response.status_code == 200
        assert data["classification"] in ["scam", "likely_scam"]
        assert "response" in data
        print("✅ Shadow Ingest Success!")
        return data
    except Exception as e:
        print(f"❌ Shadow Ingest Failed: {e}")
        return None

def test_invalid_key():
    print("\n🔐 Testing Invalid Key Protection...")
    url = f"{BACKEND_URL}/api/v1/internal/demo/ingest"
    headers = {
        "Content-Type": "application/json",
        "X-Rakshak-Key": "wrong_key"
    }
    payload = {"message": "test"}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        assert response.status_code == 403
        print("✅ Invalid Key Correctly Rejected!")
    except Exception as e:
        print(f"❌ Security Test Failed: {e}")

def test_intelligence_retrieval():
    print("\n📊 Testing Intelligence Retrieval...")
    url = f"{BACKEND_URL}/api/v1/internal/demo/intelligence"
    headers = {"X-Rakshak-Key": INTERNAL_KEY}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Fetched {len(data)} demo cases.")
        assert response.status_code == 200
        assert isinstance(data, list)
        print("✅ Intelligence Retrieval Success!")
    except Exception as e:
        print(f"❌ Intelligence Retrieval Failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Integration Tests...")
    test_shadow_ingest()
    test_invalid_key()
    test_intelligence_retrieval()
