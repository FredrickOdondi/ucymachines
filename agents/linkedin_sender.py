from datetime import datetime
from graph.state import AgentState, ExecutionStatus

def linkedin_execution_node(state: AgentState):
    """
    Executes the message sending.
    """
    print("--- LINKEDIN EXECUTION AGENT ---")
    
    content = state.get("outreach_content")
    contacts = state.get("contacts")
    
    if not content or not content["linkedin_message"] or not contacts:
        return {
            "execution_status": {
                "message_sent": False,
                "timestamp": datetime.now().isoformat(),
                "contact_name": "None"
            }
        }
        
    target_name = contacts[0]["name"]
    
    # Simulate API Call
    # LinkedInAPI.send_message(id=..., text=...)
    print(f" >> SENDING MESSAGE TO: {target_name}")
    print(f" >> CONTENT: {content['linkedin_message']}")
    
    return {
        "execution_status": {
            "message_sent": True,
            "timestamp": datetime.now().isoformat(),
            "contact_name": target_name
        }
    }
