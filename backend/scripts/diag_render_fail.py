
import os
import sys

# Simulate Render environment
os.environ["DATABASE_URL"] = "sqlite:///test_render_fail.db"
os.environ["SECRET_KEY"] = "test_secret"
os.environ["ALLOW_INSECURE_KEY"] = "1"

print("--- Starting Comprehensive Startup Diagnosis ---")

try:
    print("1. Checking imports...")
    import fastapi
    import sqlalchemy
    import redis
    import bcrypt
    import jose
    import webauthn
    import slowapi
    import passlib
    print("   Standard libs ok.")

    print("2. Importing backend modules...")
    # Add backend to path
    sys.path.append(os.getcwd())
    
    import database
    import security
    import dependencies
    import analyzer
    import agent
    print("   Module imports ok.")

    print("3. Checking routers...")
    from routers import auth, agent_router, stats_router, webhooks_router
    print("   Routers ok.")

    print("4. Attempting database initialization...")
    database.init_db()
    print("   init_db ok.")

    print("5. Checking main server file...")
    import server
    print("   server.py imported ok.")

    print("\n✅ DIAGNOSIS PASSED: No immediate startup errors found.")

except Exception as e:
    print(f"\n❌ DIAGNOSIS FAILED")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
