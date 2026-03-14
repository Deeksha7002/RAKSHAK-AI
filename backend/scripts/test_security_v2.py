
import requests
import time

BASE_URL = "http://localhost:8000"

def test_unauthorized_access():
    print("--- Testing Unauthorized Access ---")
    endpoints = ["/api/stats", "/api/cases", "/api/report"]
    for ep in endpoints:
        try:
            res = requests.get(f"{BASE_URL}{ep}") if ep != "/api/report" else requests.post(f"{BASE_URL}{ep}", json={})
            print(f"Endpoint {ep}: Status {res.status_code}")
            if res.status_code == 401:
                print(f"✅ Correctly blocked {ep}")
            else:
                print(f"❌ FAILED to block {ep}")
        except Exception as e:
            print(f"Error testing {ep}: {e}")

def test_biometric_rate_limiting():
    print("\n--- Testing Biometric Rate Limiting ---")
    # Using /api/auth/biometric/login/start as it's the easiest to hit repeatedly
    url = f"{BASE_URL}/api/auth/biometric/login/start?username=testuser"
    
    print("Sending 7 rapid requests...")
    for i in range(7):
        try:
            res = requests.post(url)
            print(f"Request {i+1}: Status {res.status_code}")
            if res.status_code == 429:
                print(f"✅ SUCCESS: Rate limit triggered at request # {i+1}")
                return
        except Exception as e:
            print(f"Error on request {i+1}: {e}")
    print("❌ FAILED: Rate limit not triggered after 7 attempts")

if __name__ == "__main__":
    test_unauthorized_access()
    test_biometric_rate_limiting()
