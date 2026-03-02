import sqlite3
import datetime
import os

def debug_stats():
    conn = sqlite3.connect('rakshak_ai.db')
    cur = conn.cursor()
    
    now = datetime.datetime.now(datetime.timezone.utc)
    day_ago = now - datetime.timedelta(days=1)
    
    print(f"NOW: {now.isoformat()}")
    print(f"DAY_AGO: {day_ago.isoformat()}")
    
    cur.execute('SELECT id, timestamp FROM cases ORDER BY timestamp DESC')
    rows = cur.fetchall()
    
    print(f"\nTotal Cases: {len(rows)}")
    
    today_count = 0
    older_count = 0
    
    for i, (cid, ts) in enumerate(rows):
        try:
            c_time = datetime.datetime.fromisoformat(ts.replace('Z', '+00:00'))
            if c_time.tzinfo is None:
                c_time = c_time.replace(tzinfo=datetime.timezone.utc)
            
            is_today = c_time > day_ago
            if is_today:
                today_count += 1
            else:
                older_count += 1
                
            if i < 10:
                print(f"Case {cid[:8]}: {ts} | Is Today: {is_today}")
        except Exception as e:
            print(f"Error parsing case {cid[:8]}: {e}")

    print(f"\nCalculated Today: {today_count}")
    print(f"Calculated Older: {older_count}")
    
    conn.close()

if __name__ == "__main__":
    debug_stats()
