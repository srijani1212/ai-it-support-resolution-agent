import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.schemas import TicketRequest, LoginRequest, EnvironmentResetRequest
from app.api.routes import submit_ticket, login, get_environment, reset_environment
from app.tools.mock_env import mock_environment

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        mock_environment.reset()

    def test_environment_endpoints(self):
        state = get_environment()
        self.assertEqual(state.password_status, "expired")

        reset_req = EnvironmentResetRequest(vpn_connected=True, password_status="active")
        updated_state = reset_environment(reset_req)
        self.assertTrue(updated_state.vpn_connected)
        self.assertEqual(updated_state.password_status, "active")

    def test_login_endpoint(self):
        mock_environment.reset(password_status="expired")
        login_res = login(LoginRequest(username="emp_1042", password="password"))
        self.assertFalse(login_res.success)

        mock_environment.reset(password_status="active")
        login_res = login(LoginRequest(username="emp_1042", password="password"))
        self.assertTrue(login_res.success)

    def test_tickets_endpoint_vpn(self):
        mock_environment.reset(vpn_connected=False, certificate_valid=True)
        res = submit_ticket(TicketRequest(ticket="VPN is not connecting"))
        self.assertEqual(res.status, "RESOLVED")
        self.assertTrue(res.environment_state.vpn_connected)

if __name__ == "__main__":
    unittest.main()
