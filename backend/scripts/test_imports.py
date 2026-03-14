
import sys
import os

# Add the current directory to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

print("--- Testing Imports ---")
try:
    print("Testing dependencies import...")
    from backend import dependencies
    print("✅ dependencies imported")
    
    print("Testing server import...")
    from backend import server
    print("✅ server imported")
except Exception as e:
    import traceback
    print(f"❌ FAILED: {e}")
    traceback.print_exc()
