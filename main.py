from dotenv import load_dotenv
from graph.workflow import create_graph

load_dotenv()

def main():
    print("Initializing LangGraph Workflow...")
    app = create_graph()
    
    print("Running optimization search...")
    # Initialize with empty state - the trigger detector will start the process
    # In a real scenario, input might come here, or the trigger detector is just a scheduled job.
    initial_state = {}
    
    # Run the graph
    result = app.invoke(initial_state)
    
    print("\n--- FINAL STATE ---")
    
    contacts = result.get("contacts", [])
    if contacts:
        print(f"Contact Found: {contacts[0]['name']} ({contacts[0]['linkedin_url']})")
    
    exec_status = result.get("execution_status", {})
    if exec_status.get("message_sent"):
        print(f"Message Status: SENT to {exec_status['contact_name']}")
        print(f"Timestamp: {exec_status['timestamp']}")
    else:
        print("Message Status: NOT SENT")
        
    print("\nWorkflow Completed.")

if __name__ == "__main__":
    main()
