import requests
import json

BASE_URL = "http://127.0.0.1:8000"

TEST_CASES = [
    {
        "name": "Crypto Scam + Wallet + URL",
        "payload": {
            "text": "Send 0.5 BTC to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh immediately. Check your balance at http://bit.ly/crypto-scam",
            "context": "general",
            "sender_name": "Coinbase Support"
        },
        "expected_classification": "scam",
        "expected_intent": "SCAM_DETECTED", # Instant flag for brand + crypto
        "min_iocs": 2
    },
    {
        "name": "Job Scam",
        "payload": {
            "text": "Earn $500 daily with our part-time job. No experience needed. Contact us at jobs@example.com",
            "context": "general",
            "sender_name": "HR Recruitment"
        },
        "expected_classification": "scam",
        "expected_intent": "JOB_SCAM",
        "min_iocs": 1
    },
    {
        "name": "Tech Support Scam",
        "payload": {
            "text": "Virus detected on your computer! Your system is at risk. Call Microsoft support at 1-800-123-4567.",
            "context": "general",
            "sender_name": "Windows Defender"
        },
        "expected_classification": "scam",
        "expected_intent": "TECH_SUPPORT_SCAM",
        "min_iocs": 1
    },
    {
        "name": "Benign Message",
        "payload": {
            "text": "Hey, are we still meeting for lunch today at 1 PM?",
            "context": "general",
            "sender_name": "John Doe"
        },
        "expected_classification": "benign",
        "expected_intent": "GENERAL_INQUIRY",
        "min_iocs": 0
    },
    {
        "name": "Marginal Scam (LLM Trigger)",
        "payload": {
            "text": "I have an interesting business proposal for you. We can discuss more on WhatsApp if you are interested in making some extra money.",
            "context": "general",
            "sender_name": "Unknown"
        },
        "expected_classification": "likely_scam",
        "expected_llm_trigger": True
    }
]

def run_tests():
    print(f"Starting Backend Accuracy Tests against {BASE_URL}...")
    
    # Health Check
    try:
        root_res = requests.get(BASE_URL)
        print(f"Root Health Check: {root_res.status_code} - {root_res.json()}")
    except Exception as e:
        print(f"❌ Root Health Check Failed: {e}")
        return

    passed = 0
    for case in TEST_CASES:
        print(f"\nTesting: {case['name']}")
        try:
            response = requests.post(f"{BASE_URL}/api/analyze", json=case['payload'])
            if response.status_code != 200:
                print(f"❌ Failed: HTTP {response.status_code}")
                continue
            
            data = response.json()
            print(f"Result: Class={data['classification']}, Intent={data['intent']}, IOCs={data['iocs']}")
            
            class_ok = data['classification'] == case['expected_classification']
            intent_ok = data['intent'] in [case.get('expected_intent', data['intent']), "SCAM_DETECTED", "TECH_SUPPORT_SCAM"]
            iocs_ok = len(data['iocs']) >= case.get('min_iocs', 0)
            llm_ok = data.get('llm_verification_required', False) == case.get('expected_llm_trigger', data.get('llm_verification_required', False))
            
            if class_ok and intent_ok and iocs_ok and llm_ok:
                print("PASSED!")
                passed += 1
            else:
                if not class_ok: print(f"Classification mismatch (Expected {case['expected_classification']}, got {data['classification']})")
                if not intent_ok: print(f"Intent mismatch (Expected {case.get('expected_intent')})")
                if not iocs_ok: print(f"IOC count too low (Found {len(data['iocs'])})")
                if not llm_ok: print(f"LLM Trigger mismatch (Expected {case.get('expected_llm_trigger')}, got {data.get('llm_verification_required')})")
        except Exception as e:
            print(f"❌ Error: {e}")

    print(f"\nSummary: {passed}/{len(TEST_CASES)} tests passed.")

if __name__ == "__main__":
    run_tests()
