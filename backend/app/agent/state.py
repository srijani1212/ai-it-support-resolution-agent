
from typing import List, Dict, Any, Optional, Literal, TypedDict


class AgentState(TypedDict, total=False):
    ticket: str
    issue_type: Optional[str]
    knowledge: List[str]
    messages: List[Dict[str, Any]]
    actions_taken: List[str]
    tool_results: List[Dict[str, Any]]

    status: Literal[
        "IN_PROGRESS",
        "PENDING_LOGIN",
        "RESOLVED",
        "ESCALATE"
    ]

    attempt_count: int
    reason: Optional[str]
    resolution: Optional[str]
    events: List[Dict[str, Any]]
    verified: bool
    last_tool_name: Optional[str]
    new_password: Optional[str]
