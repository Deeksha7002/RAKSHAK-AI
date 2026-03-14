
import os
import sys
from datetime import datetime, timedelta, timezone as tz
import hashlib

# Mock env for security.py
os.environ["SECRET_KEY"] = "test_debug_key"
os.environ["ALLOW_INSECURE_KEY"] = "1"

# Paths
CWD = r"c:\Users\yashb\OneDrive\Attachments\scam detection\backend"
sys.path.append(CWD)

from database import SessionLocal, User, RefreshToken, init_db
import security

def debug_register(username, password):
    print(f"--- Debugging Registration for {username} ---")
    db = SessionLocal()
    try:
        # 1. Check if exists
        print("Checking if user exists...")
        user = db.query(User).filter(User.username == username).first()
        if user:
            print("User already exists. Deleting for clean test...")
            db.delete(user)
            db.commit()
        
        # 2. Hash password
        print("Hashing password...")
        hashed_pw = security.get_password_hash(password)
        
        # 3. Create user
        print("Creating User object...")
        user = User(username=username, hashed_password=hashed_pw, role="operator")
        db.add(user)
        
        print("Committing user...")
        db.commit()
        print("User committed.")

        # 4. Tokens
        print("Creating tokens...")
        access_token = security.create_access_token(data={"sub": user.username, "role": user.role})
        raw_refresh = security.create_refresh_token()
        token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
        
        print("Creating RefreshToken object...")
        db_refresh = RefreshToken(
            token_hash=token_hash,
            username=user.username,
            expires_at=datetime.now(tz.utc) + timedelta(days=security.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(db_refresh)
        
        print("Committing refresh token...")
        db.commit()
        print("Registration flow complete!")
        
    except Exception as e:
        print(f"FAILED with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    debug_register("japan", "testpass")
