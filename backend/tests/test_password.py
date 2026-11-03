import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tools.mock_env import mock_environment
from app.tools.password_tools import check_password_status, reset_password, mock_login
from app.agent.graph import run_agent

class TestPasswordTroubleshooting(unittest.TestCase):
    def setUp(self):
        mock_environment.reset(password_status="expired")

    def test_login_fails_before_password_reset(self):
        """Verify login fails before password reset."""
        self.assertEqual(mock_environment.password_status, "expired")
        login_res = mock_login("emp_1042", "CorporatePass2026!")
        self.assertFalse(login_res["success"])
        self.assertIn("expired", login_res["message"].lower())

    def test_login_succeeds_after_password_reset(self):
        """Verify login succeeds after password reset."""
        reset_res = reset_password()
        self.assertTrue(reset_res["success"])
        self.assertEqual(mock_environment.password_status, "active")

        login_res = mock_login("emp_1042", "CorporatePass2026!")
        self.assertTrue(login_res["success"])
        self.assertIn("successful", login_res["message"].lower())

    def test_password_success_agent_resolution(self):
        """Test full agent resolution flow for expired password."""
        mock_environment.reset(password_status="expired")
        response = run_agent("My Active Directory password expired and I am locked out of SSO")

        self.assertEqual(response.status, "RESOLVED")
        self.assertIn("check_password_status", response.actions_taken)
        self.assertIn("reset_password", response.actions_taken)
        self.assertEqual(mock_environment.password_status, "active")
        
        # Verify subsequent login actually works
        login_res = mock_login("emp_1042", "CorporatePass2026!")
        self.assertTrue(login_res["success"])

    def test_password_reset_failure_handling(self):
        """Test password reset tool forced failure and escalation behavior."""
        mock_environment.reset(password_status="expired")
        res = reset_password(forced_failure=True)
        self.assertFalse(res["success"])
        self.assertEqual(mock_environment.password_status, "expired")

if __name__ == "__main__":
    unittest.main()
