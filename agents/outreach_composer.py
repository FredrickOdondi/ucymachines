from graph.state import AgentState, OutreachContent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

def personalized_outreach_node(state: AgentState):
    """
    Crafts a non-spammy, contextual LinkedIn message.
    """
    print("--- PERSONALIZED OUTREACH AGENT ---")
    
    contacts = state.get("contacts", [])
    if not contacts:
        return {"outreach_content": {"linkedin_message": "", "personalization_tokens_used": []}}
    
    # Target the highest priority contact
    target = contacts[0]
    trigger = state["trigger_data"]
    
    trigger = state["trigger_data"]
    
    # Initialize Gemini LLM
    llm = ChatGoogleGenerativeAI(
        temperature=0.7, 
        model="gemini-2.5-flash", 
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )

    target_name = target['name']
    is_placeholder = target.get("is_placeholder", False)
    
    # Prompt Engineering
    system = """You are an expert sales development representative for UCymachines, a used machinery dealer.
    You specialize in buying surplus industrial equipment from factories closing down or liquidating.
    Your tone is professional, empathetic (if closing), and direct but not pushy.
    Draft a short LinkedIn message to a decision maker at a company that might be selling equipment.
    Keep it under 300 characters if possible. Do not include placeholders like [Your Name].
    """
    
    if is_placeholder:
        system += "\nNOTE: Specific person discovery is in progress. Draft a general message addressed to the management or operations team."
        target_name = "Management Team"

    human = """
    Target Name: {target_name}
    Company: {company_name}
    Trigger Event: {trigger_type} ({confidence} confidence)
    Source Context: {signal_source}
    
    Draft the outreach message.
    """
    
    prompt = ChatPromptTemplate.from_messages([("system", system), ("human", human)])
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "target_name": target['name'],
            "company_name": trigger["company_name"],
            "trigger_type": trigger["trigger_type"],
            "confidence": f"{int(trigger['confidence_score']*100)}%",
            "signal_source": trigger["signal_source"]
        })
        message = response.content
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback
        message = (
            f"Hi {target['name'].split()[0]}, noticed reports about {trigger['company_name']} "
            f"undergoing a {trigger['trigger_type'].lower()}. "
            "We help handle surplus machinery verification and sales if you need assistance."
        )
    
    return {
        "outreach_content": {
            "linkedin_message": message,
            "personalization_tokens_used": ["trigger_context", "company_name", "first_name", "AI_GENERATED"]
        }
    }
