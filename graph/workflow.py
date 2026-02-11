from langgraph.graph import START, END, StateGraph

from graph.state import AgentState
from agents.trigger_detector import trigger_detection_node
from agents.company_qualifier import company_qualification_node
from agents.decision_maker_finder import decision_maker_discovery_node
from agents.outreach_composer import personalized_outreach_node
from agents.email_sender import email_execution_node
from agents.memory_tracker import memory_tracker_node

# --- Conditional Logic ---

def should_qualify(state: AgentState):
    trigger = state.get("trigger_data")
    if trigger and trigger["confidence_score"] > 0.0 and trigger["trigger_type"] != "None":
        return "company_qualifier"
    return END

def should_find_decision_maker(state: AgentState):
    company = state.get("company_data")
    if company and company["company_verified"]:
        return "decision_maker_finder"
    return END

def should_compose_outreach(state: AgentState):
    contacts = state.get("contacts")
    if contacts and len(contacts) > 0:
        return "outreach_composer"
    return END

def should_send_email(state: AgentState):
    content = state.get("outreach_content")
    contacts = state.get("contacts")
    # Check if we have content and at least one contact with an email
    if content and (content.get("email_message") or content.get("linkedin_message")) and contacts and contacts[0].get("email"):
        return "email_sender"
    return END

# --- Graph Construction ---

def create_graph():
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("trigger_detector", trigger_detection_node)
    workflow.add_node("company_qualifier", company_qualification_node)
    workflow.add_node("decision_maker_finder", decision_maker_discovery_node)
    workflow.add_node("outreach_composer", personalized_outreach_node)
    workflow.add_node("email_sender", email_execution_node)
    workflow.add_node("memory_tracker", memory_tracker_node)

    # Add Edges
    workflow.add_edge(START, "trigger_detector")
    
    workflow.add_conditional_edges(
        "trigger_detector",
        should_qualify,
        {
            "company_qualifier": "company_qualifier",
            END: END
        }
    )
    
    workflow.add_conditional_edges(
        "company_qualifier",
        should_find_decision_maker,
        {
            "decision_maker_finder": "decision_maker_finder",
            END: END
        }
    )

    workflow.add_conditional_edges(
        "decision_maker_finder",
        should_compose_outreach,
        {
            "outreach_composer": "outreach_composer",
            END: END
        }
    )

    workflow.add_conditional_edges(
        "outreach_composer",
        should_send_email,
        {
            "email_sender": "email_sender",
            END: END
        }
    )

    workflow.add_edge("email_sender", "memory_tracker")
    
    # Add a final saver node or edge logic (Implicit here for simplicity, we'll hook into main/api)
    workflow.add_edge("memory_tracker", END)

    return workflow.compile()
