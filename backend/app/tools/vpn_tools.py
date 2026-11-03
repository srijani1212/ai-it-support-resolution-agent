from typing import Dict, Any
from .mock_env import mock_environment

def check_vpn_status() -> Dict[str, Any]:
    """Check current VPN adapter connection status."""
    connected = mock_environment.vpn_connected
    mock_environment.last_action = f"Checked VPN status: {'connected' if connected else 'disconnected'}"
    return {
        "tool": "check_vpn_status",
        "status": "connected" if connected else "disconnected",
        "details": f"VPN client interface is currently {'UP (10.200.4.15)' if connected else 'DOWN / Disconnected'}."
    }

def restart_vpn() -> Dict[str, Any]:
    """Attempt to restart the corporate VPN tunnel service and re-establish gateway connection."""
    # Check if certificate is valid first
    if not mock_environment.certificate_valid:
        mock_environment.last_action = "Attempted VPN restart: FAILED (invalid machine certificate)"
        return {
            "tool": "restart_vpn",
            "success": False,
            "status": "disconnected",
            "error": "Authentication handshake failed: Device client certificate is expired or invalid."
        }

    if not mock_environment.vpn_service_healthy:
        mock_environment.last_action = "Attempted VPN restart: FAILED (daemon crashed)"
        return {
            "tool": "restart_vpn",
            "success": False,
            "status": "disconnected",
            "error": "VPN tunnel daemon failed to bind socket."
        }

    # Successful restart
    mock_environment.vpn_connected = True
    mock_environment.last_action = "Restarted VPN service: SUCCESS (connected)"
    return {
        "tool": "restart_vpn",
        "success": True,
        "status": "connected",
        "details": "VPN service daemon restarted cleanly. Tunnel negotiated and IP assigned."
    }

def check_certificate() -> Dict[str, Any]:
    """Check validity of user/machine SSL/TLS security certificate used for VPN authentication."""
    valid = mock_environment.certificate_valid
    mock_environment.last_action = f"Checked client certificate: {'valid' if valid else 'invalid/expired'}"
    return {
        "tool": "check_certificate",
        "certificate_valid": valid,
        "status": "valid" if valid else "expired_or_invalid",
        "details": "Corporate X.509 Device Certificate is valid and signed by Internal CA." if valid else "Device Certificate has expired or has revoked trust chain."
    }
