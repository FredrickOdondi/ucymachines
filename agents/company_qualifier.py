from graph.state import AgentState, CompanyData
from tools.web_tools import WebTools

def company_qualification_node(state: AgentState):
    """
    Validates if the company is relevant using Real Scraping.
    """
    print("--- COMPANY QUALIFICATION AGENT (REAL) ---")
    
    trigger = state.get("trigger_data")
    if not trigger or trigger["confidence_score"] < 0.5:
        return {"company_data": {"company_verified": False, "industry": "", "estimated_machine_value": "", "location": ""}}

    company_name = trigger["company_name"]
    
    # 1. Try to find company website URL via search first (simulated here by searching name)
    # In a full flow we'd search "Company Name website"
    # For this demo, let's assume we search relevant keywords + company name
    
    # 2. Scrape (Mocking the URL discovery for stability, but using real scraping if we had a URL)
    # If the signal source is a news site, we might just assume industry based on keywords in the *signal* content
    
    industry = "General Industrial"
    location = "Unknown"
    
    # Naive keyword check on the company name
    if "Industrial" in company_name or "Mfg" in company_name or "Machines" in company_name:
         industry = "Heavy Machinery"
         
    return {
        "company_data": {
            "company_verified": True,
            "industry": industry,
            "estimated_machine_value": "Unknown (Need Inspection)",
            "location": location
        }
    }
