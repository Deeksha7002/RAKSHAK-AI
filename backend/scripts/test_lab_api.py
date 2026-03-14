
import requests
import json
import os

# Base URL (Vite proxy might not be available for raw requests, using direct backend)
BASE_URL = "http://127.0.0.1:8000"

def test_analyze_endpoint():
    print("--- Testing /api/analyze Endpoint ---")
    
    test_cases = [
        {"name": "Standard Scam", "payload": {"text": "URGENT: Your account is locked. Click here: http://scam.xyz"}},
        {"name": "Safe Message", "payload": {"text": "Hey, are we still meeting for lunch today?"}},
        {"name": "IRS Scam", "payload": {"text": "This is the IRS. You owe taxes. Pay now or be arrested."}},
        {"name": "Empty Input", "payload": {"text": ""}},
        {"name": "Whitespace Only", "payload": {"text": "   "}},
        {"name": "None Text (Edge Case)", "payload": {"text": None}},
    ]

    for case in test_cases:
        print(f"\nRunning case: {case['name']}")
        try:
            response = requests.post(f"{BASE_URL}/api/analyze", json=case['payload'], timeout=5)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Classification: {data.get('classification')}")
                print(f"Intent: {data.get('intent')}")
                # Verify keys exist
                assert "risk_score" in data
                assert "classification" in data
                assert "iocs" in data
                print("✅ PASSED")
            else:
                # If we expect it to fail (non-200), that's fine for invalid inputs if handled, 
                # but our goal is to not CRASH.
                print(f"❌ FAILED with non-200 status. Server likely crashed or returned error.")
                print(f"Detail: {response.text}")
        except Exception as e:
            print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_analyze_endpoint()
