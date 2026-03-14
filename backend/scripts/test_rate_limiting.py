
import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def test_rate_limiting():
    print("--- Testing Rate Limiting on /api/login ---")
    
    # We expect the 6th request to fail if limit is 5/minute
    payload = {"username": "admin", "password": "wrongpassword"}
    
    for i in range(1, 8):
        try:
            response = requests.post(f"{BASE_URL}/api/login", json=payload)
            print(f"Request {i}: Status {response.status_code}")
            if response.status_code == 429:
                print("✅ PASSED: Rate limit triggered at request #", i)
                return True
        except Exception as e:
            print(f"❌ ERROR: {e}")
            break
            
    print("❌ FAILED: Rate limit was not triggered after 7 attempts.")
    return False

if __name__ == "__main__":
    # Ensure server is running before starting
    try:
        requests.get(BASE_URL)
        test_rate_limiting()
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Backend server is not running. Please start backend/server.py first.")
