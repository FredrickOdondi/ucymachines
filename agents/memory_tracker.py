from graph.state import AgentState, Memory

def memory_tracker_node(state: AgentState):
    """
    Tracks state and prevents duplicates.
    """
    print("--- MEMORY TRACKER AGENT ---")
    
    exec_status = state.get("execution_status")
    
    if exec_status and exec_status["message_sent"]:
        # Simulate saving to DB
        # DB.save(contact_id, message, timestamp)
        print(" >> OUPUT SAVED TO MEMORY")
        return {
            "memory": {
                "response_received": False,
                "response_type": "None",
                "follow_up_required": True # Check back in 3 days
            }
        }
    
    return {"memory": {}}
