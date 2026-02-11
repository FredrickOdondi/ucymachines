# Nick AI Agent - Setup Guide

**Nick** is your AI-powered platform guide, built with LangGraph and powered by Zhipu GLM-4.

## 🤖 What Can Nick Do?

- **Guide you through platform features** - Step-by-step instructions
- **Answer questions** - How do I approve leads? How do I export data?
- **Troubleshoot issues** - Help fix common problems
- **Explain workflows** - Understand the platform better

## 🚀 Setup Instructions

### 1. Get Zhipu AI API Key

1. Go to: https://open.bigmodel.cn/usercenter/apikeys
2. Create an account or login
3. Generate a new API key
4. Copy the API key

### 2. Add API Key to Environment

Add to your `.env` file:
```bash
ZHIPUAI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

```bash
cd /Users/fredrickotieno/Desktop/MachineryLeads
pip install langchain-glm langgraph langchain-core
```

### 4. Restart the Backend

```bash
# Stop the current backend if running
# Then start it again
uvicorn api.server:app --reload
```

## 💡 How to Use

### Access Nick:
1. Open the MachineryLeads platform
2. Look for the green chat button (bottom-right corner)
3. Click to open the chat
4. Ask Nick anything!

### Example Questions:
- "How do I approve a lead?"
- "What's the difference between Inbox and Leads Database?"
- "How do I export my leads?"
- "Why isn't my email sending?"
- "Explain the approval workflow"

## 🏗️ Technical Details

### Architecture:
- **Frontend**: React chat widget (floating, bottom-right)
- **Backend**: FastAPI + LangGraph
- **Model**: Zhipu GLM-4
- **Endpoint**: `POST /api/nick/chat`

### Features:
- **Context-aware**: Knows which page you're on
- **Conversation memory**: Remembers your chat session
- **Knowledge base**: Comprehensive platform documentation
- **LangGraph powered**: Intent understanding + response generation

## 📝 Files Created/Modified

### New Files:
- `agents/nick_agent.py` - Nick's brain (LangGraph agent)
- `api/nick_api.py` - Nick's API endpoint
- `frontend/src/components/NickChatWidget.jsx` - Chat UI

### Modified Files:
- `api/server.py` - Added Nick endpoints
- `frontend/src/App.jsx` - Added Nick widget
- `requirements.txt` - Added langchain-glm
- `.env.example` - Added ZHIPUAI_API_KEY

## 🧪 Test Nick

### Test from Backend:
```bash
cd /Users/fredrickotieno/Desktop/MachineryLeads
python -c "
from agents.nick_agent import ask_nick_sync
print(ask_nick_sync('How do I approve a lead?', 'approvals'))
"
```

### Test from Frontend:
1. Start frontend: `npm run dev`
2. Open http://localhost:5173
3. Click the green chat button
4. Ask: "What can you do?"

## 🔧 Troubleshooting

### Nick says "having trouble connecting":
- Check backend is running
- Verify API key is set correctly
- Check console for errors

### No response:
- Check API key is valid
- Check internet connection
- Verify Zhipu AI service is up

### Chat widget not showing:
- Check frontend is running
- Clear browser cache
- Check browser console for errors

## 🚀 Next Steps

Once Nick is working, you can enhance him with:
- **Action capabilities** - Approve leads, run searches
- **Proactive tips** - "Have you tried exporting your leads?"
- **Analytics insights** - "You have 5 pending approvals"
- **Multi-language** - Support other languages

## 💡 Tips for Best Results

- **Be specific**: Instead of "help me", say "how do I approve a lead"
- **Provide context**: "I'm on the dashboard page"
- **Ask follow-ups**: Nick remembers your conversation

---

Built with ❤️ using LangGraph + GLM-4
