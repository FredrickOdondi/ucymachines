"""
Nick AI Agent API Endpoint
FastAPI endpoint for the AI chat assistant
"""

from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add parent directory to path to import agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Lazy imports to avoid Python 3.14 Pydantic v1 compatibility issues
_nick_agent_functions = None
def _get_nick_functions():
    """Lazy load Nick agent functions -优先使用 Gemini"""
    global _nick_agent_functions
    if _nick_agent_functions is None:
        try:
            # Try Gemini first
            from agents.nick_agent_gemini import ask_nick_sync, GEMINI_AVAILABLE
            if GEMINI_AVAILABLE:
                _nick_agent_functions = (ask_nick_sync, "gemini")
            else:
                raise ImportError("Gemini not available")
        except Exception as e:
            print(f"[NickAPI] Gemini agent not available: {e}")
            try:
                # Fallback to GLM-4.7
                from agents.nick_agent_glm import ask_nick_sync, GLM_AVAILABLE
                _nick_agent_functions = (ask_nick_sync, "glm-4.7" if GLM_AVAILABLE else "simple")
            except Exception as e2:
                print(f"[NickAPI] GLM-4.7 agent not available: {e2}")
                try:
                    # Fallback to simple agent
                    from agents.nick_agent_simple import ask_nick_sync
                    _nick_agent_functions = (ask_nick_sync, "simple")
                except Exception as e3:
                    print(f"[NickAPI] Simple agent not available: {e3}")
                    _nick_agent_functions = (None, "none")
    return _nick_agent_functions

class ChatRequest(BaseModel):
    """Chat request schema"""
    message: str
    current_page: Optional[str] = "dashboard"
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    """Chat response schema"""
    response: str
    agent: str = "Nick"
    version: str = "gemini"  # gemini, simple, or none

# Store conversation history (in production, use Redis or database)
conversation_history = {}

async def chat_with_nick(request: ChatRequest) -> ChatResponse:
    """
    Chat with Nick AI agent

    Args:
        request: Chat request with message and current page context

    Returns:
        Nick's response
    """
    try:
        # Get response from Nick (lazy loaded)
        ask_nick_sync, version = _get_nick_functions()

        if ask_nick_sync is None:
            raise HTTPException(
                status_code=503,
                detail="Nick agent is not available. Please check your API configuration."
            )

        response = ask_nick_sync(
            question=request.message,
            current_page=request.current_page
        )

        # Store conversation history if needed
        if request.conversation_id:
            if request.conversation_id not in conversation_history:
                conversation_history[request.conversation_id] = []

            conversation_history[request.conversation_id].append({
                "user": request.message,
                "nick": response
            })

            # Keep only last 20 messages
            if len(conversation_history[request.conversation_id]) > 20:
                conversation_history[request.conversation_id] = conversation_history[request.conversation_id][-20:]

        return ChatResponse(
            response=response,
            agent="Nick",
            version=version
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat_with_nick: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Sorry, I'm having trouble right now. Error: {str(e)}"
        )

def get_conversation_history(conversation_id: str, limit: int = 10):
    """
    Get conversation history for a session

    Args:
        conversation_id: Unique identifier for conversation
        limit: Number of recent messages to return

    Returns:
        List of recent messages
    """
    if conversation_id not in conversation_history:
        return []

    return conversation_history[conversation_id][-limit:]
