import unittest
import sys
import os

# Add backend directory to sys.path for direct test execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tools.mock_env import mock_environment
from app.tools.vpn_tools import check_vpn_status, restart_vpn, check_certificate
from app.agent.graph import run_agent

class TestVPNTroubleshooting(unittest.TestCase):
    def setUp(self):
        mock_environment.reset(vpn_connected=False, certificate_valid=True, password_status="active")

    def test_vpn_status_initial_disconnected(self):
        res = check_vpn_status()
        self.assertEqual(res["status"], "disconnected")
        self.assertFalse(mock_environment.vpn_connected)

    def test_vpn_restart_success(self):
        res = restart_vpn()
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "connected")
        self.assertTrue(mock_environment.vpn_connected)

        # Re-check status tool
        status_res = check_vpn_status()
        self.assertEqual(status_res["status"], "connected")

    def test_vpn_success_agent_resolution(self):
        """Test full agent resolution flow for VPN disconnection."""
        mock_environment.reset(vpn_connected=False, certificate_valid=True)
        response = run_agent("My corporate VPN is disconnected and won't connect to gateway")

        self.assertEqual(response.status, "RESOLVED")
        self.assertIn("check_vpn_status", response.actions_taken)
        self.assertIn("restart_vpn", response.actions_taken)
        self.assertTrue(mock_environment.vpn_connected)
        self.assertTrue(any(e.event_type == "verification" for e in response.events))

    def test_vpn_escalation_when_certificate_invalid(self):
        """Test escalation when VPN restart fails due to invalid/expired client certificate."""
        mock_environment.reset(vpn_connected=False, certificate_valid=False)
        response = run_agent("Cannot connect to VPN from remote office")

        self.assertEqual(response.status, "ESCALATE")
        self.assertIn("restart_vpn", response.actions_taken)
        self.assertIn("check_certificate", response.actions_taken)
        self.assertIn("certificate", response.reason.lower())
        self.assertFalse(mock_environment.vpn_connected)

    def test_certificate_check_tool(self):
        mock_environment.reset(certificate_valid=False)
        res = check_certificate()
        self.assertFalse(res["certificate_valid"])
        self.assertEqual(res["status"], "expired_or_invalid")

if __name__ == "__main__":
    unittest.main()
