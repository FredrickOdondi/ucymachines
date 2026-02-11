"""
Nick AI Agent - Powered by GLM-4-Plus from Z.ai
Uses zai SDK directly (compatible with Python 3.12)
"""

import os
from typing import Optional
from zai import ZaiClient
from dotenv import load_dotenv

load_dotenv()

# Initialize Z.ai client
GLM_AVAILABLE = False
client = None

try:
    api_key = os.getenv("ZAI_API_KEY")
    if not api_key:
        # Try alternative env variable names
        api_key = os.getenv("ZHIPUAI_API_KEY") or os.getenv("GLM_API_KEY") or os.environ.get("ZAI_API_KEY", "")

    if api_key:
        client = ZaiClient(api_key=api_key)
        GLM_AVAILABLE = True
        print("[Nick Agent GLM] ✅ GLM-4-Plus from Z.ai initialized successfully")
    else:
        print("[Nick Agent GLM] ⚠️  No ZAI_API_KEY found in environment")
except Exception as e:
    print(f"[Nick Agent GLM] Initialization failed: {e}")
    GLM_AVAILABLE = False

# Platform knowledge context
PLATFORM_KNOWLEDGE = """
You are Nick, an AI assistant for the MachineryLeads platform.

## About MachineryLeads
MachineryLeads is an AI-powered B2B lead generation platform that helps businesses find and connect with companies selling industrial machinery.

## Key Pages & Features

### 1. Dashboard
- Overview with statistics (total leads, contacted, responsive)
- Quick action buttons for common tasks
- Recent activity feed showing agent operations

### 2. Leads Approval (Approvals Page)
- Review AI-detected leads before outreach
- Each lead shows: company info, contacts, AI-drafted message
- Users can edit messages, approve (sends email), or discard
- Run AI Search triggers new lead discovery

### 3. Inbox
- Manage ongoing conversations with leads
- View message history
- Send follow-up messages
- Filter by status (replied, pending)
- Company details panel with confidence scores

### 4. Leads Database
- View all leads (approved, pending, discarded)
- Search by company name or contact person
- Filter by status
- Export to CSV functionality
- Detailed lead information including industry, location, trigger type

### 5. Settings/Config
- Gmail integration for sending emails
- Email sync configuration
- AI scheduler for automated searches
- Platform authentication

## Workflows

**Finding Leads:**
1. Go to Dashboard → Click "Scrape EMS" or "Run AI Search"
2. Wait for AI to discover leads
3. Review in Leads Approval page
4. Edit message if needed → Approve & Send
5. Lead moves to Inbox for conversation

**Managing Conversations:**
1. Go to Inbox
2. Select conversation from list
3. Review messages and send follow-ups
4. Check company details for context

**Exporting Leads:**
1. Go to Leads Database
2. Apply filters if needed
3. Click "Export to CSV"

## Your Role
- Be helpful, friendly, and concise
- Provide step-by-step guidance
- Explain features clearly
- Offer tips and best practices
- If you don't know something specific, be honest and suggest general approaches
- Use emojis occasionally to be friendly 😊
- Adapt responses based on which page the user is currently on
"""

def ask_nick_sync(question: str, current_page: str = "dashboard") -> str:
    """
    Ask Nick a question and get a dynamic AI-generated response using GLM-4.7 from Z.ai

    Args:
        question: User's question
        current_page: Which page the user is currently viewing

    Returns:
        Nick's response
    """
    if not GLM_AVAILABLE or client is None:
        return "Sorry, I'm having trouble connecting to my AI brain right now. Please check that ZAI_API_KEY is set in your .env file."

    try:
        # Create context-aware prompt
        prompt = f"""{PLATFORM_KNOWLEDGE}

Current Context:
- User is on the: {current_page} page
- User's question: "{question}"

Provide a helpful, friendly response. If the user's question is a greeting or casual conversation, respond naturally. If they're asking for help, provide clear step-by-step guidance.
"""

        # Generate response using GLM-4.7 from Z.ai
        response = client.chat.completions.create(
            model="glm-4.7",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1024,
        )

        # Extract text from response
        if response and response.choices and len(response.choices) > 0:
            return response.choices[0].message.content.strip()
        else:
            return "I'm sorry, I couldn't generate a response. Please try again."

    except Exception as e:
        print(f"[Nick Agent GLM] Error generating response: {e}")
        return f"Sorry, I encountered an error: {str(e)}. Please try again or contact support."

if __name__ == "__main__":
    # Test the agent
    print("Testing Nick Agent with GLM-4.7 from Z.ai...")

    if not GLM_AVAILABLE:
        print("GLM not available. Please set ZAI_API_KEY environment variable.")
    else:
        print("\n--- Test 1: Greeting ---")
        print(ask_nick_sync("Hello Nick!", "dashboard"))

        print("\n--- Test 2: Help request ---")
        print(ask_nick_sync("How do I approve a lead?", "approvals"))

        print("\n--- Test 3: Casual question ---")
        print(ask_nick_sync("How are you doing today?", "dashboard"))
