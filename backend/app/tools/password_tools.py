from typing import Dict, Any
import secrets
import string

from .mock_env import mock_environment


def check_password_status() -> Dict[str, Any]:
    """Query the mock identity provider for the user's password state."""
    status = mock_environment.password_status
    mock_environment.last_action = f"Queried password status: {status}"

    return {
        "tool": "check_password_status",
        "password_status": status,
        "details": (
            f"Identity Provider status: password is currently {status.upper()}."
        ),
    }


def _generate_temporary_password() -> str:
    """Generate a demo temporary password."""
    alphabet = string.ascii_letters + string.digits
    random_part = "".join(secrets.choice(alphabet) for _ in range(8))
    return f"Temp@{random_part}"


def reset_password(forced_failure: bool = False) -> Dict[str, Any]:
    """Reset the user's password and generate a temporary credential."""

    if forced_failure:
        mock_environment.last_action = (
            "Attempted password reset: FAILED "
            "(Directory synchronization lock)"
        )

        return {
            "tool": "reset_password",
            "success": False,
            "error": (
                "Directory Service locked: unable to write new credential object."
            ),
        }

    temporary_password = _generate_temporary_password()

    # Update the mock identity provider
    mock_environment.password_status = "active"
    mock_environment.temp_password = temporary_password

    mock_environment.last_action = (
        "Reset user password: SUCCESS "
        "(temporary password generated)"
    )

    return {
        "tool": "reset_password",
        "success": True,
        "password_status": "active",
        "new_password": temporary_password,
        "details": (
            "Password successfully reset. A temporary password was generated. "
            "User must authenticate with the temporary password."
        ),
    }


def mock_login(
    username: str = "emp_1042",
    password: str = "",
) -> Dict[str, Any]:
    """Simulate corporate login against the mock directory."""

    # Password is still expired
    if mock_environment.password_status == "expired":
        return {
            "success": False,
            "message": (
                f"Login failed: password expired for user {username}. "
                "Please use the AI-generated temporary password after reset."
            ),
            "password_status": "expired",
        }

    # Account is active, so validate the actual password
    expected_password = getattr(
        mock_environment,
        "temp_password",
        None,
    )

    if expected_password and password == expected_password:
        return {
            "success": True,
            "message": (
                f"Login successful for user {username}. "
                "Welcome to Enterprise Portal."
            ),
            "password_status": "active",
        }

    return {
        "success": False,
        "message": (
            "Login failed: incorrect password. "
            "Please use the temporary password issued by the AI agent."
        ),
        "password_status": "active",
    }