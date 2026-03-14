
import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal, User, init_db
import security

def create_user():
    init_db()
    db = SessionLocal()
    try:
        username = "test_manual_user"
        # Delete if exists
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            db.delete(existing)
            db.commit()
            print(f"Deleted existing user {username}")

        hashed_pw = security.get_password_hash("password")
        user = User(username=username, hashed_password=hashed_pw, role="operator")
        db.add(user)
        db.commit()
        print(f"Successfully created user {username}")
    except Exception as e:
        print(f"Error creating user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
