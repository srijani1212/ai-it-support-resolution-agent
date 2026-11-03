from .mock_env import mock_environment, MockITEnvironment
from .vpn_tools import check_vpn_status, restart_vpn, check_certificate
from .password_tools import check_password_status, reset_password, mock_login

AVAILABLE_TOOLS = {
    "check_vpn_status": check_vpn_status,
    "restart_vpn": restart_vpn,
    "check_certificate": check_certificate,
    "check_password_status": check_password_status,
    "reset_password": reset_password,
}

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "check_vpn_status",
            "description": "Check if the corporate VPN connection is active or disconnected.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "restart_vpn",
            "description": "Restart the local VPN tunnel service to re-establish connection to the corporate gateway.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_certificate",
            "description": "Verify whether the client machine security certificate is valid or expired.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_password_status",
            "description": "Check the Active Directory account password state (active, expired, or locked).",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "reset_password",
            "description": "Reset the employee's expired or locked password and restore account status to active.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

__all__ = [
    "mock_environment",
    "MockITEnvironment",
    "check_vpn_status",
    "restart_vpn",
    "check_certificate",
    "check_password_status",
    "reset_password",
    "mock_login",
    "AVAILABLE_TOOLS",
    "TOOL_DEFINITIONS",
]
