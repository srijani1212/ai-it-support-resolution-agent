import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tools.mock_env import mock_environment, MockITEnvironment

class TestMockEnvironment(unittest.TestCase):
    def test_mock_environment_defaults(self):
        env = MockITEnvironment()
        state = env.get_state()
        self.assertFalse(state["vpn_connected"])
        self.assertTrue(state["certificate_valid"])
        self.assertEqual(state["password_status"], "expired")
        self.assertTrue(state["vpn_service_healthy"])

    def test_mock_environment_reset_custom(self):
        mock_environment.reset(
            vpn_connected=True,
            certificate_valid=False,
            password_status="locked",
            vpn_service_healthy=False
        )
        state = mock_environment.get_state()
        self.assertTrue(state["vpn_connected"])
        self.assertFalse(state["certificate_valid"])
        self.assertEqual(state["password_status"], "locked")
        self.assertFalse(state["vpn_service_healthy"])

    def test_mock_environment_state_transitions(self):
        mock_environment.reset(vpn_connected=False)
        self.assertFalse(mock_environment.vpn_connected)
        mock_environment.vpn_connected = True
        self.assertTrue(mock_environment.get_state()["vpn_connected"])

if __name__ == "__main__":
    unittest.main()
