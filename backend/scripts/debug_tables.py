
from sqlalchemy import create_engine, inspect
import os

# Resolve DB path
db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rakshak_ai.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_file}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
inspector = inspect(engine)

print("--- Database Tables ---")
tables = inspector.get_table_names()
print(f"Tables: {tables}")

for table in tables:
    columns = [c["name"] for c in inspector.get_columns(table)]
    print(f"\nTable '{table}' columns: {columns}")
    
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = res.scalar()
            print(f"Row count: {count}")
    except Exception as e:
        print(f"Error counting rows: {e}")

required_tables = ["users", "cases", "stats", "webauthn_challenges", "refresh_tokens"]
missing = [t for t in required_tables if t not in tables]
if missing:
    print(f"\n❌ MISSING TABLES: {missing}")
else:
    print("\n✅ All required tables exist.")
