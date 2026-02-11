"""
Nick AI Agent - Simple Version (Works without langchain-glm)
Temporary fallback until GLM-4 package is installed
"""

def ask_nick_sync(question: str, current_page: str = "dashboard") -> str:
    """
    Simple Nick assistant that works without external dependencies
    """

    question_lower = question.lower().strip()

    # Handle greetings first
    greetings = ["hello", "hi ", "hey", "hola", "greetings"]
    if any(question_lower.startswith(g) or question_lower == g for g in greetings):
        return f"Hey there! 👋 I'm Nick, your AI assistant for MachineryLeads. I'm here to help you navigate the platform and answer any questions. What can I help you with today?"

    # Handle thanks
    if any(word in question_lower for word in ["thank", "thanks", "appreciate"]):
        return "You're welcome! 😊 Let me know if you need anything else. I'm here to help!"

    # Handle "how are you"
    if any(phrase in question_lower for phrase in ["how are you", "how's it going", "how do you do"]):
        return "I'm doing great, thanks for asking! 😊 I'm here and ready to help you with anything you need about MachineryLeads. What would you like to know?"

    # Handle general help requests
    if any(word in question_lower for word in ["help", "can you", "what can you"]):
        return """I can definitely help! Here's what I can do:

📋 **Platform Guidance:**
• Explain how any feature works
• Walk you through workflows step-by-step
• Answer questions about specific pages

🔧 **Common Tasks:**
• Approving leads and sending outreach
• Managing conversations in the Inbox
• Exporting leads to CSV
• Configuring Gmail and settings

💡 **Tips & Best Practices:**
• Improve your lead response rates
• Troubleshoot issues
• Platform shortcuts and features

Just ask me anything! For example: "How do I approve a lead?" or "What's the difference between Inbox and Leads Database?"
"""

    # Knowledge base about the platform
    responses = {
        "dashboard": """
The Dashboard is your main overview page! Here you can:
• See total leads, contacted leads, and responsive leads
• Quick actions: Scrape EMS, Search LinkedIn, View Approvals, Export Leads
• View recent activity feed
• Click any button to navigate to that feature
        """,

        "approvals": """
The Leads Approval page is where you review AI-detected leads before outreach:

How it works:
1. AI scans for signals (factory closures, expansions, etc.)
2. Leads appear in the approval list (left side)
3. Click a lead to view details
4. Review the AI-drafted message - click "Edit" to modify
5. Click "Approve & Send" to approve, or "Discard" to reject
6. Approved leads move to the Inbox for ongoing conversation

You can also click "Run AI Search" to manually trigger a new search!
        """,

        "inbox": """
The Inbox is where you manage conversations with your leads:

Features:
• Filter by status: All, Replied, Pending
• View message history with each lead
• Send follow-up messages
• Click the info icon (ℹ️) to see company details (confidence score, industry, location)
• Monitor which leads are most engaged

Tips:
• Respond promptly to increase conversion
• Personalize your follow-ups
• Check company details to prepare for conversations
        """,

        "leads": """
The Leads Database lets you view, search, and export all your leads:

How to use:
• Search by company name or contact person
• Filter by status (All, Approved, Pending, Discarded)
• Click "Export to CSV" to download leads
• View detailed information for each lead

Columns:
- Company, Contact Person, Email, Industry, Location
- Trigger Type, Confidence Score, Status, Source

Best for:
- Bulk operations
- Data analysis
- Exporting for CRM systems
        """,

        "config": """
The Settings/Config page is where you configure platform features:

Gmail Integration:
- Connect your Gmail account for sending emails
- Required for email outreach features

Email Sync:
- Configure automatic email synchronization
- Match incoming emails to leads

AI Scheduler:
- Set up automated lead generation schedule
- Configure when to run searches

Make sure to save your changes after configuring!
        """,

        "how": """
Here are some common workflows:

**Find and Approve Leads:**
1. Go to Dashboard → Click "Scrape EMS"
2. Wait for AI to find leads
3. Go to Leads Approval → Review each lead
4. Edit message if needed → Click "Approve & Send"

**Manage Conversations:**
1. Go to Inbox
2. Select a conversation from the list
3. Review messages and send follow-ups

**Export Leads:**
1. Go to Leads Database
2. Apply filters if needed
3. Click "Export to CSV"
4. File downloads automatically
        """,

        "export": """
To export your leads:

1. Go to the Leads Database page
2. Use the search and filters to find specific leads
3. Click the "Export to CSV" button (top right)
4. The file downloads automatically with the name: leads_export_YYYY-MM-DD.csv

The CSV includes: Company, Contact, Email, Industry, Location, Trigger Type, Confidence Score, Status, and Source
        """,

        "approve": """
To approve a lead:

1. Go to the Leads Approval page
2. Click on a lead from the list (left side)
3. Review the lead details and AI-drafted message
4. If needed, click "Edit" to modify the message
5. Click the green "Approve & Send" button
6. The lead will be moved to your Inbox for conversation

Tips:
• Always review the message before sending
• Check the confidence score (higher = better match)
• Verify company details are accurate
• Personalize messages for better response rates
        """,

        "default": f"""Hmm, I'm not sure I understood that completely. 🤔

I'm Nick, your AI assistant for MachineryLeads! I can help you with:

• **Approving leads** - "How do I approve a lead?"
• **Managing conversations** - "What's the difference between Inbox and Leads Database?"
• **Exporting data** - "How do I export my leads?"
• **Settings & config** - "How do I connect Gmail?"
• **Best practices** - "Tips for better response rates"

You're currently on the **{current_page}** page.

Could you rephrase your question? Or try one of the examples above!
        """
    }

    # Determine the best response based on keywords (only if not already handled above)
    if "dashboard" in question_lower or "overview" in question_lower:
        return responses["dashboard"]
    elif "approve" in question_lower or "approval" in question_lower:
        return responses["approve"]
    elif "inbox" in question_lower or "message" in question_lower or "conversation" in question_lower:
        return responses["inbox"]
    elif "export" in question_lower or "csv" in question_lower or "download" in question_lower:
        return responses["export"]
    elif "database" in question_lower or "leads" in question_lower:
        return responses["leads"]
    elif "config" in question_lower or "setting" in question_lower or "setup" in question_lower:
        return responses["config"]
    elif "how" in question_lower or "workflow" in question_lower or "guide" in question_lower:
        return responses["how"]
    else:
        return responses["default"]

if __name__ == "__main__":
    # Test
    print(ask_nick_sync("How do I approve a lead?", "approvals"))
