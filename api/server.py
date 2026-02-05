from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.service import run_agent_workflow, get_system_health, start_scheduler, stop_scheduler, get_scheduler_status
from api.sqlite_store import SQLiteStore
from pydantic import BaseModel
from typing import List, Optional
from tools.ems_scraper import EMSScraper
from tools.linkedin_scraper import LinkedInScraper

app = FastAPI(title="Ucymachines AI Orchestration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TriggerRequest(BaseModel):
    query: str = "factory closing"

class UpdateLeadRequest(BaseModel):
    status: Optional[str] = None
    outreach_content: Optional[dict] = None

@app.get("/health")
def health_check():
    return get_system_health()

@app.post("/workflow/run")
def run_workflow(request: TriggerRequest):
    try:
        result = run_agent_workflow(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/stats")
def get_stats():
    # Get stats from SQLite
    db_stats = SQLiteStore.get_stats()
    return {
        "total_signals": 12840,
        "successful_outreaches": 3120,
        "positive_responses": 452,
        "system_uptime": "99.9%",
        "database": db_stats
    }

@app.get("/dashboard/leads")
def get_leads():
    return SQLiteStore.get_leads()

@app.put("/dashboard/leads/{lead_id}")
def update_lead(lead_id: int, request: UpdateLeadRequest):
    updated_lead = SQLiteStore.update_lead(lead_id, request.dict(exclude_unset=True))
    if not updated_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return updated_lead

class MessageRequest(BaseModel):
    content: str
    sender: str = "User" # or "AI"

@app.post("/dashboard/leads/{lead_id}/messages")
def add_message(lead_id: int, request: MessageRequest):
    import datetime
    
    msg = {
        "content": request.content,
        "sender": request.sender,
        "timestamp": datetime.datetime.now().strftime("%I:%M %p"),
        "isAi": False
    }
    updated_lead = SQLiteStore.add_message_to_lead(lead_id, msg)
    if not updated_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return updated_lead

@app.get("/dashboard/activity")
def get_activity_feed():
    # Mock feed
    return [
        {"time": "14:22:01", "agent": "DiscoveryAgent", "message": "Enriched lead #UCY-992 (Lathe Ops)", "type": "info"},
        {"time": "14:21:55", "agent": "Router", "message": "Branching to Outreach for #UCY-988", "type": "info"},
        {"time": "14:21:40", "agent": "QualAgent", "message": "Filtering signal stream... 14 entries dropped.", "type": "warning"},
    ]

class SchedulerRequest(BaseModel):
    interval_minutes: int = 10

class LinkedInSearchRequest(BaseModel):
    companies: List[dict]
    positions: Optional[List[str]] = None

@app.post("/scheduler/start")
def start_automated_search(request: SchedulerRequest):
    """Start automated AI search at specified interval."""
    result = start_scheduler(request.interval_minutes)
    return result

@app.post("/scheduler/stop")
def stop_automated_search():
    """Stop the automated AI search."""
    result = stop_scheduler()
    return result

@app.get("/scheduler/status")
def scheduler_status():
    """Get the current status of the scheduler."""
    return get_scheduler_status()

# ============= EMS Automation Endpoints =============

@app.post("/ems/scrape")
def scrape_ems_companies():
    """Scrape EMS companies from all configured sources and save to SQLite."""
    try:
        scraper = EMSScraper()
        companies = scraper.scrape_all(save_to_db=True)
        return {
            "status": "success",
            "companies": companies,
            "total_found": len(companies),
            "database_stats": SQLiteStore.get_stats()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

@app.post("/ems/linkedin-search")
def search_linkedin_profiles(request: LinkedInSearchRequest):
    """Search for LinkedIn profiles for target positions at companies."""
    try:
        linkedin = LinkedInScraper()
        
        # Limit to first 20 companies to avoid timeouts
        companies_to_search = request.companies[:20]
        
        companies_with_profiles = linkedin.find_profiles_batch(
            companies_to_search,
            request.positions,
            max_companies=20,
            save_to_db=True
        )
        
        total_profiles = sum(c.get("total_profiles", 0) for c in companies_with_profiles)
        
        return {
            "status": "success",
            "companies": companies_with_profiles,
            "total_profiles_found": total_profiles,
            "companies_with_profiles": sum(1 for c in companies_with_profiles if c.get("total_profiles", 0) > 0),
            "companies_searched": len(companies_with_profiles),
            "total_companies": len(request.companies),
            "limited": len(request.companies) > 20,
            "database_stats": SQLiteStore.get_stats()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LinkedIn search failed: {str(e)}")

# ============= Database Endpoints =============

@app.get("/database/stats")
def get_database_stats():
    """Get comprehensive database statistics."""
    return SQLiteStore.get_stats()

@app.get("/database/companies")
def get_all_companies():
    """Get all companies in the database."""
    return SQLiteStore.get_all_companies()

@app.get("/database/profiles")
def get_all_profiles():
    """Get all LinkedIn profiles in the database."""
    return SQLiteStore.get_all_profiles(limit=500)

@app.delete("/database/clear")
def clear_database():
    """Clear all data from database (CAUTION!)."""
    SQLiteStore.clear_all()
    return {"status": "cleared", "message": "All data has been cleared"}
