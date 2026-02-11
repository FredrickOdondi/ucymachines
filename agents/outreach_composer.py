from graph.state import AgentState, OutreachContent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

def personalized_outreach_node(state: AgentState):
    """
    Crafts a non-spammy, contextual email message.
    """
    print("--- PERSONALIZED OUTREACH AGENT ---")

    contacts = state.get("contacts", [])
    if not contacts:
        return {"outreach_content": {"email_message": "", "linkedin_message": "", "personalization_tokens_used": []}}

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

    # Prompt Engineering - Updated for longer email messages
    system = """You are an expert sales development representative for UCymachines, a used machinery dealer.
    You specialize in buying surplus industrial equipment from factories closing down or liquidating.
    Your tone is professional, empathetic (if closing), and direct but not pushy.

    Draft a professional, detailed email message (200-300 words) to a decision maker at a company that might be selling equipment.

    IMPORTANT REQUIREMENTS:
    - Always use "Hello" as the salutation (e.g., "Hello John," or "Hello Management Team,")
    - Write a comprehensive message with 3-4 paragraphs
    - Include a clear subject line that's relevant and professional
    - Explain UCymachines' value proposition in detail
    - Mention experience with similar situations/companies
    - Include a clear call-to-action
    - Do not include placeholders like [Your Name]

    Structure:
    1. Professional greeting with "Hello"
    2. Context about why you're reaching out (the trigger event)
    3. Brief introduction of UCymachines and expertise
    4. How you can help with their specific situation
    5. Clear next steps/call to action
    6. Professional closing
    """

    if is_placeholder:
        system += "\nNOTE: Specific person discovery is in progress. Draft a general message addressed to the management or operations team."
        target_name = "Management Team"

    human = """
    Target Name: {target_name}
    Company: {company_name}
    Trigger Event: {trigger_type} ({confidence} confidence)
    Source Context: {signal_source}

    Draft a comprehensive, professional email message following the structure above.
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
        # Fallback - longer professional email
        first_name = target['name'].split()[0] if target['name'] != "Management Team" else "there"
        message = (
            f"Subject: Machinery Liquidation Inquiry - {trigger['company_name']}\n\n"
            f"Hello {first_name},\n\n"
            f"I hope this email finds you well. I recently learned about {trigger['company_name']} "
            f"undergoing a {trigger['trigger_type'].lower()}, and I wanted to reach out regarding any surplus "
            f"industrial equipment that may become available during this transition.\n\n"
            f"At UCymachines, we specialize in purchasing used and surplus machinery from facilities "
            f"undergoing changes like yours. With over 15 years of experience in the industry, we offer fair "
            f"market valuations, handle all logistics, and can close transactions quickly if needed.\n\n"
            f"If you anticipate having equipment to sell, I'd welcome the opportunity to discuss how we might "
            f"be able to assist. Even if you're not sure what you'll be selling yet, I'm happy to provide "
            f"guidance on the process and what typically has the most value.\n\n"
            f"Would you be available for a brief call this week to discuss your situation?\n\n"
            f"Best regards,\n"
            f"The UCymachines Team"
        )

    return {
        "outreach_content": {
            "email_message": message,
            "linkedin_message": message,  # Keep for backwards compatibility
            "personalization_tokens_used": ["trigger_context", "company_name", "first_name", "AI_GENERATED"]
        }
    }
