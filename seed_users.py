"""
Seed script: migrates users from users.json into the SQLite DB used by the running backend.
Run from the project root: python seed_users.py
"""
import sqlite3
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from security import get_password_hash

DB_PATH = "rakshak_ai.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check which columns exist
cur.execute("PRAGMA table_info(users)")
cols = [row[1] for row in cur.fetchall()]
print("Existing columns:", cols)

# Add missing columns if needed
if "webauthn_credentials" not in cols:
    cur.execute('ALTER TABLE users ADD COLUMN webauthn_credentials TEXT DEFAULT "[]"')
    print("Added webauthn_credentials column")

if "role" not in cols:
    cur.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'operator'")
    print("Added role column")

conn.commit()

# Check existing users
cur.execute("SELECT username FROM users")
existing = [row[0] for row in cur.fetchall()]
print("Users already in DB:", existing)

# Seed from users.json
import json
users_json_path = os.path.join(os.path.dirname(__file__), "backend", "users.json")
with open(users_json_path) as f:
    users_map = json.load(f)

role_map = {"admin": "admin"}

for username, password in users_map.items():
    if username in existing:
        print(f"[SKIP] {username}")
    else:
        hashed = get_password_hash(password)
        role = role_map.get(username, "operator")
        cur.execute(
            "INSERT INTO users (username, hashed_password, role, webauthn_credentials) VALUES (?, ?, ?, ?)",
            (username, hashed, role, "[]")
        )
        print(f"[ADDED] {username}")

conn.commit()
conn.close()
print("Seeding complete.")
