import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tools.mock_env import mock_environment
from app.agent.graph import run_agent
from app.agent.nodes import llm_reasoning_node, tool_execution_node, MAX_STEPS
from app.rag.mock_rag import mock_rag

class TestAgentBehaviors(unittest.TestCase):
    def setUp(self):
        mock_environment.reset()

    def test_unsupported_issue_escalates_immediately(self):
        """Unsupported issue returns no relevant RAG knowledge and escalates immediately."""
        knowledge = mock_rag.retrieve("Need access to SAP Financials module 94")
        self.assertEqual(len(knowledge), 0)

        response = run_agent("Need access to SAP Financials module 94")
        self.assertEqual(response.status, "ESCALATE")
        self.assertIn("Unsupported issue", response.reason)
        self.assertEqual(len(response.actions_taken), 0)
        self.assertTrue(any(e.event_type == "escalation" for e in response.events))

    def test_maximum_step_protection(self):
        """Verify agent enforces max 6 step protection and escalates."""
        state = {
            "ticket": "vpn connection issues",
            "issue_type": "vpn",
            "knowledge": ["SOP-VPN-01: Check status"],
            "messages": [],
            "actions_taken": ["check_vpn_status"] * 6,
            "tool_results": [{"status": "disconnected"}] * 6,
            "attempt_count": MAX_STEPS, # 6 attempts already
            "events": [],
        }
        next_state = llm_reasoning_node(state)
        self.assertEqual(next_state.get("status"), "ESCALATE")
        self.assertIn("Maximum troubleshooting attempts", next_state.get("reason", ""))

    def test_invalid_tool_response_and_execution_guard(self):
        """Verify unknown tool requests are safely handled and escalated."""
        state = {
            "last_tool_name": "invented_fake_tool_xyz",
            "actions_taken": [],
            "tool_results": [],
            "events": [],
            "messages": [],
        }
        res_state = tool_execution_node(state)
        self.assertEqual(res_state.get("status"), "ESCALATE")
        self.assertIn("not recognized", res_state.get("reason", ""))

    def test_tool_failure_handling(self):
        """Verify tool failure returns structured error and updates environment correctly."""
        mock_environment.reset(vpn_connected=False, certificate_valid=False)
        state = {
            "last_tool_name": "restart_vpn",
            "actions_taken": [],
            "tool_results": [],
            "events": [],
            "messages": [],
        }
        res_state = tool_execution_node(state)
        tool_result = res_state["tool_results"][-1]
        self.assertFalse(tool_result.get("success"))
        self.assertIn("expired or invalid", tool_result.get("error", ""))

    def test_never_claim_success_without_verification(self):
        """Verify the agent takes multiple steps including verification before resolving."""
        mock_environment.reset(password_status="expired")
        response = run_agent("Password is expired and cannot sign in")
        self.assertEqual(response.status, "RESOLVED")
        
        # Must have checked status, reset password, and verified status
        self.assertEqual(response.actions_taken[0], "check_password_status")
        self.assertEqual(response.actions_taken[1], "reset_password")
        self.assertEqual(response.actions_taken[2], "check_password_status")

if __name__ == "__main__":
    unittest.main()
