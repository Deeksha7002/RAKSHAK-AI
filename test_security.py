import urllib.request
import json
import os

BASE_URL = "http://localhost:8000/api"

def post(endpoint, data):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method='POST')
    req.add_header('Content-Type', 'application/json')
    jsondata = json.dumps(data).encode('utf-8')
    req.add_header('Content-Length', len(jsondata))
    
    try:
        with urllib.request.urlopen(req, jsondata) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

print("Testing Security...\n")

# 1. Register New User
print("1. Registering 'operator1'...")
res = post("/register", {"username": "operator1", "password": "securepass123"})
if res and "token" in res:
    print("   SUCCESS: Generated Token:", res["token"][:20] + "...")
else:
    print("   FAILED")

# 2. Login
print("\n2. Logging in 'operator1'...")
res = post("/login", {"username": "operator1", "password": "securepass123"})
if res and "token" in res:
    print("   SUCCESS: Login Token:", res["token"][:20] + "...")
else:
    print("   FAILED")

# 3. Default Admin Login
print("\n3. Testing Default Admin Login...")
res = post("/login", {"username": "admin", "password": "password123"})
if res and "token" in res:
    print("   SUCCESS: Admin Token:", res["token"][:20] + "...")
else:
    print("   FAILED")

# 4. Verify Restored User 'deeksha'
print("\n4. Testing Restored User 'deeksha'...")
res = post("/login", {"username": "deeksha", "password": "123456"})
if res and "token" in res:
    print("   SUCCESS: Deeksha Token:", res["token"][:20] + "...")
else:
    print("   FAILED")

# 5. Verify DB File
if os.path.exists("./rakshak_ai.db"):
    print("\n5. Database check: 'rakshak_ai.db' EXISTS.")
else:
    print("\n5. Database check: FAILED ('rakshak_ai.db' not found).")
