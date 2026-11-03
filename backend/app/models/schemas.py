from typing import List, Optional, Literal, Dict, Any

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
        def model_dump(self):
            return self.__dict__

    def Field(*args, default=None, default_factory=None, description=None, **kwargs):
        if default is not None:
            return default
        if default_factory is not None:
            return default_factory()
        if args and args[0] is not ...:
            return args[0]
        return None

class TicketRequest(BaseModel):
    ticket: str = Field(..., description="The user ticket description")
    employee_id: Optional[str] = Field("emp_1042", description="Employee identifier")

class LoginRequest(BaseModel):
    username: str = Field(..., description="Corporate username")
    password: str = Field(..., description="Corporate password")

class LoginResponse(BaseModel):
    success: bool
    message: str
    password_status: str

class EnvironmentState(BaseModel):
    vpn_connected: bool
    certificate_valid: bool
    password_status: Literal["active", "expired", "locked"]
    vpn_service_healthy: bool = True
    last_action: Optional[str] = None

class EnvironmentResetRequest(BaseModel):
    vpn_connected: Optional[bool] = False
    certificate_valid: Optional[bool] = True
    password_status: Optional[Literal["active", "expired", "locked"]] = "expired"
    vpn_service_healthy: Optional[bool] = True

class AgentActivityEvent(BaseModel):
    step: int
    event_type: Literal["ticket_received", "rag_retrieved", "tool_selected", "tool_result", "verification", "escalation", "resolved"]
    description: str
    details: Optional[Dict[str, Any]] = None

class AgentResponse(BaseModel):
    status: Literal["PENDING_LOGIN", "RESOLVED", "ESCALATE"]
    resolution: Optional[str] = None
    actions_taken: List[str] = Field(default_factory=list)
    reason: Optional[str] = None
    tool_results: List[Dict[str, Any]] = Field(default_factory=list)
    knowledge: List[str] = Field(default_factory=list)
    events: List[AgentActivityEvent] = Field(default_factory=list)
    environment_state: Optional[EnvironmentState] = None
    new_password: Optional[str] = None

