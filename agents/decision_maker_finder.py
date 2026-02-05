from graph.state import AgentState, Contact
from tools.contact_scraper import ContactScraper
import time

def decision_maker_discovery_node(state: AgentState):
    """
    Identifies REAL people inside the company by scraping their website.
    Extracts real names and email addresses from the company website.
    """
    print("--- DECISION MAKER DISCOVERY AGENT (REAL SCRAPING) ---")
    
    company_data = state.get("company_data")
    if not company_data or not company_data["company_verified"]:
        print("  Company not verified, skipping contact discovery")
        return {"contacts": []}

    company_name = state["trigger_data"]["company_name"]
    signal_source = state["trigger_data"].get("signal_source", "")
    
    # Extract potential company URL from signal source
    company_url = None
    if signal_source and ('http' in signal_source or 'www' in signal_source):
        company_url = signal_source if signal_source.startswith('http') else f"https://{signal_source}"
    
    # REAL SCRAPING: Extract actual contacts from company website
    print(f"  Scraping real contacts for: {company_name}")
    scraped_contacts = ContactScraper.extract_contacts_from_company(company_name, company_url)
    
    if not scraped_contacts:
        print(f"  [WARNING] No contacts found for {company_name} - lead will be rejected")
        return {"contacts": []}
    
    # Priority roles for scoring
    priority_roles = {
        "CEO": 1.0, "President": 1.0, "Founder": 1.0, "Owner": 1.0,
        "Director": 0.9, "VP": 0.85, "Manager": 0.8, "Head": 0.8,
        "Contact": 0.5
    }
    
    processed_contacts = []
    for contact in scraped_contacts:
        role = contact.get('role', 'Contact')
        score = 0.5
        for p_role, p_score in priority_roles.items():
            if p_role.lower() in role.lower():
                score = p_score
                break
        
        # Only include if we have email
        if contact.get('email'):
            processed_contacts.append({
                "name": contact['name'],
                "role": role,
                "linkedin_url": contact.get('source_url', ''),
                "email": contact['email'],
                "priority_score": score
            })
    
    # Sort by priority score
    processed_contacts.sort(key=lambda x: x["priority_score"], reverse=True)
    
    print(f"  Found {len(processed_contacts)} valid contacts with emails")
    return {"contacts": processed_contacts}
