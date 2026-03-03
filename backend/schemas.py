from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AnalysisRequest(BaseModel):
    text: str
    context: Optional[str] = "general"

class ReportRequest(BaseModel):
    conversationId: str
    scammerName: Optional[str] = "Unknown"
    platform: Optional[str] = "chat"
    classification: str
    confidenceScore: float
    transcript: List[Dict[str, Any]]
    iocs: Dict[str, Any]
    timestamp: str

class LoginRequest(BaseModel):
    username: str
    password: str

class GenerateResponseRequest(BaseModel):
    message: str                                  # Latest scammer message
    persona: Optional[str] = "default"            # "naive", "skeptical", "default"
    conversation_history: Optional[List[Dict[str, str]]] = []  # [{role, content}, ...]
    classification: Optional[str] = "scam"

class RefreshRequest(BaseModel):
    refresh_token: str

class AnalyzeRequest(BaseModel): # Used by Twilio webhook
    text: str
