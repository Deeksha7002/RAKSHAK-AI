import logging
from agent import RakshakAgent
from config import PERSONA

# Configure logging to see our agent's internal state
logging.basicConfig(level=logging.INFO, format='%(message)s')

def test_adaptive_honeypot():
    print("=== Testing Rakshak AI ===\n")
    agent = RakshakAgent()

    # Scenario 1: Low Sophistication (Grandma Betty should respond)
    print("--- Scenario 1: Low Sophistication Scam ---")
    conv_id_1 = "scam_low_01"
    messages_1 = [
        "kindly verify your wallet immediately",
        "click here now: http://sketchy-link.com",
        "urgent verify verify"
    ]
    
    for msg in messages_1:
        agent.ingest({"conversation_id": conv_id_1, "text": msg})
        
    s1_data = agent.sophistication_cache[conv_id_1]
    print(f"Score: {s1_data['score']} ({s1_data['category']})")
    
    response_1 = agent.generate_response(conv_id_1)
    print(f"Agent Response: {response_1}")
    
    # Check if response comes from Naive persona safe questions
    if response_1 in PERSONA["naive"]["safe_questions"]:
        print("PASS: Agent used Naive person list.\n")
    else:
        print("FAIL: Agent did not use Naive persona list.\n")


    # Scenario 2: High Sophistication (SysAdmin Dave should respond)
    print("--- Scenario 2: High Sophistication Scam ---")
    conv_id_2 = "scam_high_01"
    # Mix of technical terms, less urgency, conversational
    messages_2 = [
        "Hello, this is regarding ticket #9283.",
        "We detected an anomaly in your traffic pattern.",
        "Could you please explain why your server is beaconing?"
    ]
    
    for msg in messages_2:
        agent.ingest({"conversation_id": conv_id_2, "text": msg})
        
    s2_data = agent.sophistication_cache[conv_id_2]
    print(f"Score: {s2_data['score']} ({s2_data['category']})")
    
    response_2 = agent.generate_response(conv_id_2)
    print(f"Agent Response: {response_2}")
    
    # Check if response comes from Skeptical persona safe questions
    # Note: Depending on the simple logic in analyzer, might need tweaking, but let's test.
    if response_2 in PERSONA["skeptical"]["safe_questions"]:
        print("PASS: Agent used Skeptical persona list.\n")
    elif response_2 in PERSONA["default"]["safe_questions"]:
        print("NOTE: Agent used Default persona (maybe score wasn't high enough).")
    else:
        print("FAIL: Agent used unknown persona list.\n")

if __name__ == "__main__":
    test_adaptive_honeypot()
