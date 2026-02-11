from graph.state import AgentState, Memory

def memory_tracker_node(state: AgentState):
    """
    Tracks state and prevents duplicates.
    """
    print("--- MEMORY TRACKER AGENT ---")

    exec_status = state.get("execution_status")

    if exec_status and exec_status.get("message_sent"):
        # Save email tracking info to memory
        memory_data = {
            "response_received": False,
            "response_type": "None",
            "follow_up_required": True,  # Check back in 3 days
            "last_outreach_channel": exec_status.get("channel", "email"),
            "last_outreach_timestamp": exec_status.get("timestamp"),
            "message_id": exec_status.get("message_id"),
            "thread_id": exec_status.get("thread_id")
        }

        # Save the AI-generated message to memory
        outreach_content = state.get("outreach_content", {})
        if outreach_content:
            memory_data["messages"] = [
                {
                    "content": outreach_content.get("email_message") or outreach_content.get("linkedin_message", ""),
                    "sender": "AI",
                    "timestamp": exec_status.get("timestamp"),
                    "isAi": True,
                    "message_id": exec_status.get("message_id"),
                    "thread_id": exec_status.get("thread_id")
                }
            ]

        print(" >> OUTPUT SAVED TO MEMORY")
        return {"memory": memory_data}

    return {"memory": {}}
