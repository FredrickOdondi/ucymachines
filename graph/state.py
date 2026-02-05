import operator
from typing import Annotated, Dict, List, TypedDict, Union

from langchain_core.messages import BaseMessage

class TriggerData(TypedDict):
    trigger_type: str
    company_name: str
    signal_source: str
    confidence_score: float

class CompanyData(TypedDict):
    company_verified: bool
    industry: str
    estimated_machine_value: str
    location: str

class Contact(TypedDict):
    name: str
    role: str
    linkedin_url: str
    priority_score: float

class OutreachContent(TypedDict):
    linkedin_message: str
    personalization_tokens_used: List[str]

class ExecutionStatus(TypedDict):
    message_sent: bool
    timestamp: str
    contact_name: str

class Memory(TypedDict):
    response_received: bool
    response_type: str  # positive, neutral, negative
    follow_up_required: bool

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    search_query: str  # Dynamic search query
    trigger_data: TriggerData
    company_data: CompanyData
    contacts: List[Contact]
    outreach_content: OutreachContent
    execution_status: ExecutionStatus
    memory: Memory
