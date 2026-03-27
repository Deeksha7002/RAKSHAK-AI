import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agent import RakshakAgent

def test_persona_switching():
    agent = RakshakAgent()
    
    test_cases = [
        {
            "message": "Your crypto wallet has been compromised. Send 1 ETH to 0x123... to secure it.",
            "expected_keywords": ["INVESTOR", "GULLIBLE_INVESTOR"]
        },
        {
            "message": "This is the IRS. You have an unpaid tax warrant. Pay $500 fine or face arrest.",
            "expected_keywords": ["CITIZEN", "PANICKED"]
        },
        {
            "message": "Microsoft Support: Your PC has a virus. Please install AnyDesk immediately.",
            "expected_keywords": ["ELDERLY", "FRIENDLY"]
        },
        {
            "message": "Earn $500/day by doing simple online tasks. Click here to start!",
            "expected_keywords": ["STUDENT", "GULLIBLE_STUDENT"]
        }
    ]
    
    print("\n--- Testing Tactical Persona Switching ---")
    for case in test_cases:
        print(f"\nMessage: {case['message']}")
        # We need to simulate the score being high enough for baiting (>0.35)
        agent.threat_score = 0.5 
        agent._check_for_persona_switch(case['message'], agent.threat_score)
        print(f"Selected Persona: {agent.current_persona}")
        
        match = any(k in agent.current_persona for k in case['expected_keywords'])
        status = "PASS" if match else "FAIL"
        print(f"Status: {status}")

if __name__ == "__main__":
    if not os.environ.get("GROQ_API_KEY"):
        print("Error: GROQ_API_KEY not set. Cannot test LLM switching.")
    else:
        test_persona_switching()
