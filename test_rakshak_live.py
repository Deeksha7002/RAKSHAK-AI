"""
Rakshak AI - Comprehensive Backend Test Suite (Fixed Routes)
"""
import requests
import json
import sys
import time

BASE_URL = "https://scam-defender-honeypot-1-fi61.onrender.com"
TOKEN = None
THREAD_ID = f"test-thread-{int(time.time())}"

PASS = "[PASS]"
FAIL = "[FAIL]"

results = []

def log(status, test_name, detail=""):
    symbol = PASS if status else FAIL
    msg = f"{symbol} {test_name}"
    if detail:
        msg += f" | {detail}"
    print(msg)
    results.append((status, test_name, detail))

# ── 1. HEALTH CHECK ────────────────────────────────────────────────────────────
def test_health():
    print("\n=== 1. BACKEND HEALTH ===")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=10)
        data = r.json()
        log(r.status_code == 200 and data.get("status") == "ok",
            "Health endpoint", f"Status: {r.status_code}, Response: {data}")
    except Exception as e:
        log(False, "Health endpoint", str(e))

    try:
        r = requests.get(f"{BASE_URL}/", timeout=10)
        log(r.status_code == 200, "Root endpoint", f"Response: {r.json()}")
    except Exception as e:
        log(False, "Root endpoint", str(e))

# ── 2. AUTHENTICATION ──────────────────────────────────────────────────────────
def test_auth():
    global TOKEN
    print("\n=== 2. AUTHENTICATION ===")
    username = f"tester_{int(time.time())}"
    try:
        r = requests.post(f"{BASE_URL}/api/register", json={
            "username": username,
            "password": "TestPass123!"
        }, timeout=15)
        reg_data = r.json()
        # Registration also returns a token directly - grab it
        TOKEN = reg_data.get("token")
        log(r.status_code in [200, 201] and bool(TOKEN),
            "Register new user + get token",
            f"Status: {r.status_code} | Token: {TOKEN[:25] if TOKEN else 'None'}...")
    except Exception as e:
        log(False, "Register user", str(e))

    if not TOKEN:
        # Try login separately with JSON body
        try:
            r2 = requests.post(f"{BASE_URL}/api/login", json={
                "username": username,
                "password": "TestPass123!"
            }, timeout=15)
            if r2.status_code == 200:
                TOKEN = r2.json().get("token")
                log(bool(TOKEN), "Login + JWT token", f"Token: {TOKEN[:25] if TOKEN else 'None'}...")
            else:
                log(False, "Login", f"Status: {r2.status_code}, Body: {r2.text[:120]}")
        except Exception as e:
            log(False, "Login", str(e))

# ── 3. SCAM DETECTION ACCURACY ─────────────────────────────────────────────────
def test_scam_detection():
    print("\n=== 3. SCAM DETECTION ACCURACY ===")
    if not TOKEN:
        print("  [SKIP] No token available")
        return

    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

    test_cases = [
        ("Your Microsoft computer has a virus. Download AnyDesk now.", "scam", "Tech Support Scam"),
        ("Send me your Bitcoin wallet address for guaranteed 10x returns!", "scam", "Crypto Scam"),
        ("Congratulations! You have won a lottery. Pay the release fee.", "scam", "Lottery Scam"),
        ("Verify your account now or it will be suspended permanently.", "scam", "Phishing"),
        ("Send your OTP code immediately.", "scam", "OTP Theft"),
        ("Hello, how are you today?", "benign", "Benign Greeting"),
        ("Can you call me when you are free?", "benign", "Benign Message"),
    ]

    for message, expected, label in test_cases:
        try:
            r = requests.post(f"{BASE_URL}/api/analyze", json={
                "text": message,
                "conversation_id": THREAD_ID
            }, headers=headers, timeout=20)
            if r.status_code == 200:
                data = r.json()
                classification = data.get("classification", "unknown")
                score = round(data.get("risk_score", 0), 3)
                persona = data.get("current_persona", "?")
                passed = classification == expected
                log(passed, f"  {label}",
                    f"Expected: {expected} | Got: {classification} | Score: {score} | Persona: {persona}")
            else:
                log(False, f"  {label}", f"HTTP {r.status_code}: {r.text[:80]}")
        except Exception as e:
            log(False, f"  {label}", str(e))
        time.sleep(0.3)  # Respect rate limits

# ── 4. LLM PERSONA RESPONSES ───────────────────────────────────────────────────
def test_llm_responses():
    print("\n=== 4. LLM PERSONA RESPONSES ===")
    if not TOKEN:
        print("  [SKIP] No token available")
        return

    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

    tests = [
        ("Your Microsoft computer has a virus!", "ELDERLY", "Tech Support -> Elderly Bait"),
        ("Invest in my new Bitcoin fund for 10x gains!", "INVESTOR", "Crypto -> Investor Persona"),
        ("You owe federal taxes. Pay now or get arrested!", "CITIZEN", "Authority -> Citizen Persona"),
    ]

    for message, persona, label in tests:
        try:
            r = requests.post(f"{BASE_URL}/api/generate-response", json={
                "message": message,
                "sender_name": "Scammer",
                "persona": persona,
                "classification": "scam",
                "context": "INBOX",
                "conversation_history": []
            }, headers=headers, timeout=25)
            if r.status_code == 200:
                data = r.json()
                resp = data.get("response", "")
                is_real_response = len(resp.strip()) > 10
                log(is_real_response, f"  {label}", f"Reply: {resp[:90]}...")
            else:
                log(False, f"  {label}", f"HTTP {r.status_code}: {r.text[:80]}")
        except Exception as e:
            log(False, f"  {label}", str(e))
        time.sleep(0.5)

# ── 5. BENIGN SILENCE ─────────────────────────────────────────────────────────
def test_benign_silence():
    print("\n=== 5. BENIGN SILENCE (No Reply for Safe Messages) ===")
    if not TOKEN:
        print("  [SKIP] No token available")
        return

    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

    try:
        r = requests.post(f"{BASE_URL}/api/generate-response", json={
            "message": "Hey! How are you doing?",
            "sender_name": "Friend",
            "persona": "ELDERLY",
            "classification": "benign",
            "context": "INBOX",
            "conversation_history": []
        }, headers=headers, timeout=15)
        if r.status_code == 200:
            resp = r.json().get("response")
            # Benign should return null/None/empty string
            is_silent = not resp or resp.strip() == ""
            log(is_silent, "  Benign message gets no reply", f"Response: {repr(resp)}")
        else:
            log(False, "  Benign silence", f"HTTP {r.status_code}")
    except Exception as e:
        log(False, "  Benign silence", str(e))

# ── SUMMARY ────────────────────────────────────────────────────────────────────
def print_summary():
    print("\n" + "="*60)
    print("RAKSHAK AI TEST RESULTS")
    print("="*60)
    passed = sum(1 for r in results if r[0])
    total = len(results)
    score = round(passed / total * 100) if total else 0
    print(f"Passed: {passed}/{total}  |  Score: {score}%")
    if any(not r[0] for r in results):
        print("\nFailed:")
        for status, name, detail in results:
            if not status:
                print(f"  {FAIL} {name.strip()}: {detail}")

if __name__ == "__main__":
    print("RAKSHAK AI - LIVE TEST SUITE")
    print(f"Target: {BASE_URL}")
    print("="*60)
    test_health()
    test_auth()
    test_scam_detection()
    test_llm_responses()
    test_benign_silence()
    print_summary()
    failed = sum(1 for r in results if not r[0])
    sys.exit(1 if failed > 0 else 0)
