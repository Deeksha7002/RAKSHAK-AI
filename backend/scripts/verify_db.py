
from sqlalchemy import create_engine, inspect
import os

# Resolve DB path
db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rakshak_ai.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_file}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
inspector = inspect(engine)

print("--- Verifying User Table Schema ---")
try:
    columns = [c["name"] for c in inspector.get_columns("users")]
    print(f"Columns in 'users': {columns}")
    if "last_login_at" in columns:
        print("✅ SUCCESS: 'last_login_at' column exists.")
    else:
        print("❌ FAILED: 'last_login_at' column missing.")
except Exception as e:
    print(f"Error: {e}")
