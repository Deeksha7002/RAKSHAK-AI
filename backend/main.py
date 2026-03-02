import time
import logging
from mock_api import MockScammerAPI
from agent import HoneypotAgent

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [MAIN] - %(message)s')

def main():
    api = MockScammerAPI()
    agent = RakshakAgent()
    
    print("=== AI Rakshak AI Agent System Started ===")
    print("Listening for incoming messages...\n")
    
    # Simulation Loop
    while True: # Run indefinitely
        # 1. Get new message from API
        msg_data = api.get_new_message()
        if not msg_data:
            time.sleep(1)
            continue
            
        print(f"\n--- New Conversation: {msg_data['conversation_id']} ---")
        
        # 2. Agent Ingests & Classifies
        classification = agent.ingest(msg_data)
        logging.info(f"Classification: {classification.upper()}")
        
        # 3. Agent Decides to Respond
        if classification in ["scam", "likely_scam"]:
            # Engage
            response = agent.generate_response(msg_data['conversation_id'])
            if response:
                # Send back to API (and maybe get a reply in a real loop)
                api.send_message(msg_data['conversation_id'], response)
                
                # Retrieve follow-up immediately for demo purposes
                # In real life, we'd wait for next event loop tick
                follow_up = api.send_message(msg_data['conversation_id'], "Previous response acknowledged by server")
                if follow_up:
                    agent.ingest(follow_up)
            else:
                logging.info("Agent chose not to respond.")
        else:
            logging.info("Benign message. Ignoring.")
            
        time.sleep(1) # Pause between cycles

    print("\n=== Simulation Complete ===")

if __name__ == "__main__":
    main()
