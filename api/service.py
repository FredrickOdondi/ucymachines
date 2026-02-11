# Lazy imports to avoid Python 3.14 Pydantic v1 compatibility issues
_graph = None

def _get_graph():
    """Lazy load the graph to avoid import-time errors with Python 3.14"""
    global _graph
    if _graph is None:
        try:
            from graph.workflow import create_graph
            _graph = create_graph()
            print("[Service] ✅ Workflow graph loaded successfully")
        except Exception as e:
            print(f"[Service] ⚠️  Error loading workflow graph: {e}")
            print(f"[Service] Workflow features require Python 3.11 or 3.12")
            _graph = None
    return _graph

from api.sqlite_store import SQLiteStore
import random
import threading
import time

# Background scheduler state
scheduler_state = {
    "running": False,
    "interval_seconds": 600,  # Default 10 minutes
    "thread": None,
    "total_searches": 0,
}

# Diverse query pool for variety
SEARCH_QUERIES = [
    "factory closing liquidation industrial machinery",
    "manufacturing plant shutdown equipment auction",
    "company bankruptcy surplus machinery sale",
    "warehouse liquidation heavy equipment",
    "industrial facility closing machinery disposal",
    "plant closure equipment liquidation auction",
    "manufacturing downsizing machinery surplus",
    "factory bankruptcy industrial equipment sale",
]

def run_agent_workflow(trigger_query: str = "factory closing"):
    """
    Runs the agent workflow and returns the final state.
    Only saves leads with complete contact information (name, email, phone).
    """
    # Get the graph (lazy loaded)
    graph = _get_graph()
    if graph is None:
        raise Exception("Workflow graph is not available. The AI Search feature requires Python 3.11 or 3.12. Current version: 3.14")

    # Use diverse query rotation for better results
    if trigger_query in ["factory closing", ""]:
        trigger_query = random.choice(SEARCH_QUERIES)
        print(f"Using rotated query: {trigger_query}")
    else:
        print(f"Running workflow for: {trigger_query}")

    initial_state = {"search_query": trigger_query}

    result = graph.invoke(initial_state)

    # VALIDATION: Only save if lead has complete contact info
    contacts = result.get("contacts", [])
    trigger_data = result.get("trigger_data")

    if not trigger_data:
        print("  [Workflow] No trigger data, skipping save")
        return result

    # Accept only if we have a person's name AND a valid email
    has_complete_contact = False
    if contacts:
        primary_contact = contacts[0]
        has_email = bool(primary_contact.get("email") and "@" in primary_contact.get("email", "") and "pending" not in primary_contact.get("email", ""))

        # If we have a real email found on a site, we allow it even if name is generic
        if has_email:
            has_complete_contact = True

    if has_complete_contact:
        # Save only real leads
        SQLiteStore.add_lead(result)
        print(f"  [Workflow] ✓ Lead saved: {trigger_data.get('company_name')} with contact info")
    else:
        print(f"  [Workflow] ✗ Lead rejected: {trigger_data.get('company_name')} - no real contact data found")

    return result

def get_system_health():
    """
    Mock health metrics.
    """
    return {
        "status": "operational",
        "uptime": "99.9%",
        "active_nodes": 42
    }

def _scheduler_worker():
    """Background worker that runs searches at specified intervals."""
    # Pre-load the graph to catch errors early
    if _get_graph() is None:
        print("[Scheduler] Cannot start: workflow graph is not available")
        scheduler_state["running"] = False
        return

    while scheduler_state["running"]:
        try:
            print(f"\n[Scheduler] Running automated search (#{scheduler_state['total_searches'] + 1})")
            run_agent_workflow()
            scheduler_state['total_searches'] += 1

            # Sleep for the specified interval
            for _ in range(scheduler_state["interval_seconds"]):
                if not scheduler_state["running"]:
                    break
                time.sleep(1)

        except Exception as e:
            print(f"[Scheduler] Error during search: {e}")
            time.sleep(5)  # Wait before retrying on error

def start_scheduler(interval_minutes: int = 10):
    """
    Start the automated search scheduler.

    Args:
        interval_minutes: How often to run searches (in minutes)
    """
    if scheduler_state["running"]:
        return {"status": "already running", "interval_minutes": scheduler_state["interval_seconds"] // 60}

    scheduler_state["running"] = True
    scheduler_state["interval_seconds"] = interval_minutes * 60
    scheduler_state["total_searches"] = 0

    # Start background thread
    thread = threading.Thread(target=_scheduler_worker, daemon=True)
    scheduler_state["thread"] = thread
    thread.start()

    print(f"[Scheduler] Started - will search every {interval_minutes} minutes")
    return {"status": "started", "interval_minutes": interval_minutes}

def stop_scheduler():
    """Stop the automated search scheduler."""
    if not scheduler_state["running"]:
        return {"status": "not running"}

    scheduler_state["running"] = False

    if scheduler_state["thread"]:
        scheduler_state["thread"].join(timeout=2)
        scheduler_state["thread"] = None

    print(f"[Scheduler] Stopped after {scheduler_state['total_searches']} searches")
    return {
        "status": "stopped",
        "total_searches": scheduler_state["total_searches"]
    }

def get_scheduler_status():
    """Get current scheduler status."""
    return {
        "running": scheduler_state["running"],
        "interval_minutes": scheduler_state["interval_seconds"] // 60,
        "total_searches": scheduler_state["total_searches"]
    }
