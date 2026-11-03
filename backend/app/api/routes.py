try:
    from fastapi import APIRouter, HTTPException
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail
            super().__init__(f"HTTP {status_code}: {detail}")

    class APIRouter:
        def post(self, path: str, **kwargs):
            def decorator(func):
                return func
            return decorator
        def get(self, path: str, **kwargs):
            def decorator(func):
                return func
            return decorator

from ..models.schemas import (
    TicketRequest,
    AgentResponse,
    LoginRequest,
    LoginResponse,
    EnvironmentState,
    EnvironmentResetRequest,
)
from ..tools import mock_environment, mock_login
from ..tools.vpn_tools import check_vpn_status, restart_vpn
from ..tools.password_tools import reset_password
from ..agent import run_agent

router = APIRouter()

@router.post("/tickets", response_model=AgentResponse)
def submit_ticket(req: TicketRequest):
    """Submits an IT support ticket to the AI Resolution Agent."""
    if not req.ticket or not req.ticket.strip():
        raise HTTPException(status_code=400, detail="Ticket description cannot be empty.")
    
    response = run_agent(req.ticket)
    return response

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    """Simulates corporate authentication against the mock environment."""
    result = mock_login(username=req.username, password=req.password)
    return LoginResponse(
        success=result["success"],
        message=result["message"],
        password_status=result["password_status"],
    )

@router.post("/change-password")
def change_password(req: dict):
    """Resets the user's password in the mock environment."""
    username = req.get("username", "emp_1042")
    new_password = req.get("new_password", "").strip()

    if not new_password:
        raise HTTPException(
            status_code=400,
            detail="New password cannot be empty."
        )

    result = reset_password()

    return {
        "success": result.get("success", False),
        "message": (
            f"Password successfully changed for user {username}."
            if result.get("success")
            else result.get("error", "Failed to change password.")
        ),
        "password_status": result.get("password_status", "active"),
    }


@router.post("/test-vpn")
def test_vpn():
    """Tests VPN connectivity and attempts a reconnect if needed."""
    status = check_vpn_status()

    if status["status"] == "connected":
        return {
            "status": "connected",
            "ip_address": "10.200.4.15",
            "gateway": "Corporate VPN Gateway",
            "tunnel_active": True,
        }

    result = restart_vpn()

    return {
        "status": result.get("status", "disconnected"),
        "ip_address": "10.200.4.15" if result.get("success") else None,
        "gateway": "Corporate VPN Gateway",
        "tunnel_active": result.get("success", False),
    }
@router.get("/environment", response_model=EnvironmentState)
def get_environment():
    """Retrieves current in-memory mock environment status."""
    state = mock_environment.get_state()
    return EnvironmentState(**state)

@router.post("/environment/reset", response_model=EnvironmentState)
def reset_environment(req: EnvironmentResetRequest):
    """Resets or customizes the in-memory mock environment state."""
    mock_environment.reset(
        vpn_connected=req.vpn_connected if req.vpn_connected is not None else False,
        certificate_valid=req.certificate_valid if req.certificate_valid is not None else True,
        password_status=req.password_status if req.password_status is not None else "expired",
        vpn_service_healthy=req.vpn_service_healthy if req.vpn_service_healthy is not None else True,
    )
    state = mock_environment.get_state()
    return EnvironmentState(**state)
