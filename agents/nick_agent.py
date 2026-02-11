"""
Nick AI Agent - MachineryLeads Platform Guide
Built with LangGraph + Zhipu GLM-4
"""

from typing import TypedDict, List, Annotated, Literal
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_glm import ChatGLM
import os
from dotenv import load_dotenv

load_dotenv()

class AgentState(TypedDict):
    """State for Nick the AI agent"""
    messages: List[str]
    current_page: str
    user_question: str
    context: str
    response: str
    next_action: str

# Initialize GLM-4
def get_llm():
    """Initialize Zhipu GLM-4 model"""
    api_key = os.getenv("ZHIPUAI_API_KEY")
    if not api_key:
        # Fallback to environment or default
        api_key = os.environ.get("ZHIPUAI_API_KEY", "")

    return ChatGLM(
        model="glm-4-plus",
        temperature=0.7,
        api_key=api_key
    )

def get_platform_knowledge() -> str:
    """
    Returns comprehensive knowledge about MachineryLeads platform
    """
    return """
    # MachineryLeads Platform Guide

## Overview
MachineryLeads is an AI-powered B2B lead generation platform that automates finding, qualifying, and engaging potential leads in the machinery manufacturing industry.

## Key Features

### 1. Dashboard (Main Page)
- **Purpose**: Overview of all lead activities and metrics
- **Key Metrics**:
  - Total potential value of all leads
  - Leads contacted count
  - Responsive leads (those who replied)
  - Pending approvals count
- **Quick Actions**:
  - Scrape EMS (trigger web scraping for machinery companies)
  - Search LinkedIn (find leads on LinkedIn)
  - Approvals (go to approval center)
  - All Leads (view leads database)
- **Recent Activity**: Shows recent lead activities in a feed

### 2. Leads Approval (Approval Center)
- **Purpose**: Review and approve AI-detected leads before outreach
- **How it works**:
  1. AI scans for signals (factory closures, expansions, etc.)
  2. Leads appear in the approval list
  3. Review each lead's details and AI-drafted message
  4. Edit the message if needed
  5. Approve & Send OR Discard
- **Actions**:
  - "Run AI Search": Manually trigger AI search for new leads
  - "Edit": Modify the AI-generated message
  - "Approve & Send": Approve lead and send outreach
  - "Discard": Reject the lead

### 3. Inbox (Messages)
- **Purpose**: View and manage conversations with leads
- **Features**:
  - Filter by status (All, Replied, Pending)
  - View message history
  - Send follow-up messages
  - Company details panel (click info icon)
  - AI confidence scores
- **How to use**:
  - Select a conversation from the left
  - Review messages on the right
  - Type and send follow-ups
  - Click info icon to see company details

### 4. Leads Database
- **Purpose**: View, search, and export all leads
- **Features**:
  - Search by company name or contact
  - Filter by status (All, Approved, Pending, Discarded)
  - Export to CSV
  - View detailed lead information
- **Columns**:
  - Company, Contact Person, Email, Industry, Location, Trigger Type, Confidence, Status

### 5. EMS Automation
- **Purpose**: Configure automated web scraping from EMS (European Machinery)
- **Configuration**:
  - Set search keywords (e.g., "factory", "manufacturing")
  - Configure scraping frequency
  - Set confidence thresholds
  - Define triggers

### 6. Settings (Config)
- **Purpose**: Platform configuration and integrations
- **Features**:
  - Gmail Integration: Connect Gmail for email sending
  - Email Sync: Configure email sync settings
  - AI Scheduler: Set up automated lead generation schedule

## Workflows

### Finding and Approving Leads:
1. Go to **Dashboard** → Click "Scrape EMS" or "Search LinkedIn"
2. Wait for AI to find leads (check Approval Center)
3. Go to **Leads Approval** → Review each lead
4. Edit message if needed → Click "Approve & Send"
5. Lead moves to **Inbox** for ongoing conversation

### Managing Conversations:
1. Go to **Inbox**
2. Select a conversation from the list
3. Review message history
4. Type follow-up message → Click send
5. Monitor for responses

### Exporting Leads:
1. Go to **Leads Database**
2. Use filters to find specific leads
3. Click "Export to CSV"
4. File downloads automatically

## Tips & Best Practices

### Lead Quality:
- Always review AI-drafted messages before sending
- Check confidence scores (higher = better match)
- Verify company details are accurate
- Personalize messages for better response rates

### Inbox Management:
- Respond promptly to incoming messages
- Use the company details panel to prepare for conversations
- Track which leads are most engaged

### EMS Automation:
- Start with broad keywords, then refine
- Run scraping during off-peak hours
- Monitor for duplicate leads

## Common Tasks

### How to add a new lead source:
→ Go to EMS Automation → Configure new search terms

### How to send bulk emails:
→ Currently not supported - send individual messages from Inbox

### How to check email performance:
→ Go to Dashboard → Check "Responsive leads" metric

### How to edit auto-generated messages:
→ Go to Leads Approval → Click "Edit" → Modify message → Approve

## Troubleshooting

### Leads not appearing:
→ Check if Gmail is connected (Settings → Gmail Integration)
→ Verify API credentials in .env file
→ Check backend logs for errors

### Messages not sending:
→ Verify Gmail connection
→ Check recipient email is valid
→ Review rate limits

### Scraping not working:
→ Check EMS automation settings
→ Verify search keywords are valid
→ Check internet connection

## Technical Details

### Authentication:
→ Currently disabled - direct access to dashboard
→ Gmail OAuth required for email features

### Data Storage:
→ SQLite database (data.db)
→ All leads, messages, and configurations stored locally

### API Endpoints:
→ Backend runs on http://127.0.0.1:8000
→ All fetch requests go to /dashboard/leads, /email/send, etc.
"""

def understand_user_intent(state: AgentState) -> AgentState:
    """
    Understand what the user is asking for
    """
    llm = get_llm()

    prompt = f"""
    You are Nick, an AI assistant for the MachineryLeads platform.
    Analyze the user's question and determine their intent.

    User Question: {state['user_question']}
    Current Page: {state['current_page']}

    Determine the intent:
    - feature_explanation: User wants to understand a feature
    - how_to: User wants step-by-step instructions
    - troubleshooting: User has a problem to solve
    - navigation: User needs help finding something
    - general: General question about the platform

    Respond with just the intent name.
    """

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        intent = response.content.strip().lower()

        # Map to valid intents
        valid_intents = ['feature_explanation', 'how_to', 'troubleshooting', 'navigation', 'general']
        if intent not in valid_intents:
            intent = 'general'

        state['next_action'] = intent
        return state
    except Exception as e:
        print(f"Error understanding intent: {e}")
        state['next_action'] = 'general'
        return state

def generate_response(state: AgentState) -> AgentState:
    """
    Generate helpful response based on user question and platform knowledge
    """
    llm = get_llm()

    system_prompt = f"""
    You are Nick, a friendly and helpful AI assistant for the MachineryLeads platform.

    Your role:
    - Guide users through the platform features
    - Provide step-by-step instructions
    - Answer questions about how things work
    - Help troubleshoot issues
    - Be concise but thorough

    Platform Context:
    Current Page: {state['current_page']}

    Communication Style:
    - Friendly and conversational
    - Use examples when helpful
    - Break down complex tasks into steps
    - If you don't know something, be honest and suggest where to find help

    Remember:
    - Keep responses under 3-4 sentences when possible
    - Use bullet points for steps
    - Be encouraging and supportive
    """

    user_prompt = f"""
    User Question: {state['user_question']}

    Use this platform knowledge to answer:

    {get_platform_knowledge()}

    Provide a helpful, friendly response.
    """

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = llm.invoke(messages)
        state['response'] = response.content.strip()
        state['next_action'] = 'end'
        return state

    except Exception as e:
        print(f"Error generating response: {e}")
        state['response'] = "I'm having trouble connecting right now. Please try again in a moment!"
        state['next_action'] = 'end'
        return state

# Build the agent graph
def build_nick_agent():
    """
    Build Nick the AI agent using LangGraph
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("understand_intent", understand_user_intent)
    workflow.add_node("generate_response", generate_response)

    # Add edges
    workflow.set_entry_point("understand_intent")
    workflow.add_edge("understand_intent", "generate_response")
    workflow.add_edge("generate_response", END)

    return workflow.compile()

# Main function to interact with Nick
async def ask_nick(question: str, current_page: str = "dashboard") -> str:
    """
    Ask Nick a question and get a response

    Args:
        question: User's question
        current_page: Current page user is on (for context)

    Returns:
        Nick's response
    """
    try:
        # Create the agent
        agent = build_nick_agent()

        # Initial state
        initial_state: AgentState = {
            "messages": [],
            "current_page": current_page,
            "user_question": question,
            "context": "",
            "response": "",
            "next_action": ""
        }

        # Run the agent
        result = await agent.ainvoke(initial_state)

        return result.get("response", "I couldn't generate a response. Please try again!")

    except Exception as e:
        print(f"Error running Nick agent: {e}")
        return f"Sorry, I encountered an error: {str(e)}"

# Simple synchronous version for FastAPI
def ask_nick_sync(question: str, current_page: str = "dashboard") -> str:
    """
    Synchronous version of ask_nick for FastAPI
    """
    import asyncio

    # For simple Q&A without full LangGraph (faster, simpler)
    llm = get_llm()

    system_prompt = f"""
    You are Nick, a friendly AI assistant for the MachineryLeads platform.

    Current Page: {current_page}

    {get_platform_knowledge()}

    Be helpful, concise, and friendly. Guide users through platform features.
    """

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=question)
        ]

        response = llm.invoke(messages)
        return response.content.strip()

    except Exception as e:
        print(f"Error: {e}")
        return "I'm having trouble connecting right now. Please try again!"

if __name__ == "__main__":
    # Test Nick
    print("🤖 Testing Nick AI Agent...")

    response = ask_nick_sync(
        question="How do I approve a lead?",
        current_page="approvals"
    )

    print(f"\nNick: {response}")
