from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AnalysisRequest(BaseModel):
    text: str
    context: Optional[str] = "general"
    sender_name: Optional[str] = ""
    conversation_id: Optional[str] = "default"

class ReportRequest(BaseModel):
    conversationId: str
    scammerName: Optional[str] = "Unknown"
    platform: Optional[str] = "chat"
    classification: str
    scamType: Optional[str] = "OTHER"
    confidenceScore: float
    transcript: List[Dict[str, Any]]
    iocs: Dict[str, Any]
    timestamp: str
    # New Phase 16 fields
    is_sealed: Optional[bool] = False
    forensic_signature: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class GenerateResponseRequest(BaseModel):
    message: str                                  # Latest scammer message
    sender_name: Optional[str] = "Unknown"        # Unique sender identifier
    persona: Optional[str] = "default"            # "naive", "skeptical", "default"
    conversation_history: Optional[List[Dict[str, str]]] = []  # [{role, content}, ...]
    classification: Optional[str] = "scam"

class RefreshRequest(BaseModel):
    refresh_token: str

class AnalyzeRequest(BaseModel): # Used by Twilio webhook
    text: str
