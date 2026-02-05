from graph.state import AgentState, TriggerData
from tools.web_tools import WebTools
from api.store import LeadStore
import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from dotenv import load_dotenv

load_dotenv()

def trigger_detection_node(state: AgentState):
    """
    Scans for signals indicating machine availability using Real Web Search.
    """
    print("--- TRIGGER DETECTION AGENT (REAL) ---")
    
    # 1. Get query from state (dynamic)
    query = state.get("search_query", "factory closing liquidation auction industrial machinery")
    print(f"Searching with query: {query}")
    raw_news = WebTools.search_signals(query)
    
    detected_trigger = None
    
    # Initialize Gemini LLM
    llm = ChatGoogleGenerativeAI(
        temperature=0, 
        model="gemini-2.5-flash", 
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )

    # Process more results for better diversity
    top_results = raw_news[:8]  # Increased from 3 to 8
    print(f"[DEBUG] Processing {len(top_results)} search results")
    
    system = """You are an expert industrial market analyst. 
    Analyze the provided search results.
    Identify ALL companies undergoing liquidation, closing, bankruptcy, or selling surplus machinery.
    Return the result as a JSON OBJECT with a key "triggers" containing a LIST of objects.
    Each object in the list should have:
    - "trigger_type"
    - "company_name"
    - "signal_source"
    - "confidence_score"
    - "draft_message": A short, polite LinkedIn outreach message (under 300 chars) to a decision maker at this company, referencing the signal.
    
    Set confidence_score based on evidence (0.0 to 1.0).
    """
    
    human = """
    Search Results:
    {json_results}
    
    Extract all strong leads.
    """
    
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", human)])
    chain = prompt | llm | JsonOutputParser()
    
    try:
        print("Analyzing signals with LLM...")
        # Process top 8 results for more diversity
        result = chain.invoke({"json_results": json.dumps(raw_news[:8])})
        print(f"[DEBUG] LLM result: {result}")
        print(f"[DEBUG] LLM extracted {len(result.get('triggers', []))} triggers")
        
        triggers = result.get("triggers", [])
        if not triggers and "trigger_type" in result: 
            # Handle case where LLM returned single object instead of list
            triggers = [result]

        # Process ALL triggers
        valid_triggers = []
        for t in triggers:
            if t.get("confidence_score", 0) > 0.4:
                valid_triggers.append(t)
                
                # NOTE: We DON'T save here anymore
                # Let the workflow complete and validate contacts first
                print(f"  Identified Lead: {t.get('company_name')} (will validate contacts later)")

        # Pick Best for Deep Dive
        if valid_triggers:
            # Sort by confidence
            valid_triggers.sort(key=lambda x: x["confidence_score"], reverse=True)
            detected_trigger = valid_triggers[0]
        
        # If LLM returned no triggers, fall back to keyword-based detection
        if not detected_trigger:
            print("[DEBUG] No triggers from LLM, running keyword-based fallback...")
            trigger_keywords = ['closing', 'liquidation', 'bankruptcy', 'auction', 'shutdown', 'surplus', 'downsizing', 'closing', 'goes out of business']
            for result_item in raw_news:
                text_to_check = (result_item.get('title', '') + ' ' + result_item.get('content', '')).lower()
                if any(keyword in text_to_check for keyword in trigger_keywords):
                    title = result_item.get('title', '')
                    words = title.split()
                    detected_trigger = {
                        "trigger_type": "facility_closure",
                        "company_name": title.split()[0] if words else "Unknown",
                        "signal_source": result_item.get('source', ''),
                        "confidence_score": 0.6,
                        "draft_message": f"Hi there, I noticed reports about your company's recent changes. We help with machinery verification and sales management. Could we connect?"
                    }
                    print(f"  Identified Lead (fallback): {detected_trigger['company_name']}")
                    break
    except Exception as e:
        print(f"LLM Trigger Detection Error: {e}")
        # Fallback: Extract triggers from raw search results based on keywords
        print("Falling back to keyword-based trigger detection...")
        trigger_keywords = ['closing', 'liquidation', 'bankruptcy', 'auction', 'shutdown', 'surplus', 'downsizing', 'closing', 'goes out of business']
        
        for result in raw_news:
            text_to_check = (result.get('title', '') + ' ' + result.get('content', '')).lower()
            
            if any(keyword in text_to_check for keyword in trigger_keywords):
                # Try to extract company name from title
                title = result.get('title', '')
                words = title.split()
                
                detected_trigger = {
                    "trigger_type": "facility_closure",
                    "company_name": title.split()[0] if words else "Unknown",
                    "signal_source": result.get('source', ''),
                    "confidence_score": 0.7,
                    "draft_message": f"Hi there, I noticed reports about your company's recent changes. We help with machinery verification and sales management. Could we connect?"
                }
                print(f"  Identified Lead (fallback): {detected_trigger['company_name']}")
                break
            
    if not detected_trigger:
        detected_trigger = {
            "trigger_type": "None",
            "company_name": "",
            "signal_source": "",
            "confidence_score": 0.0
        }

    return {"trigger_data": detected_trigger}
