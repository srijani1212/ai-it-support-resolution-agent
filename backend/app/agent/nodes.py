
import json
from typing import Dict, Any, List

from ..tools import AVAILABLE_TOOLS, TOOL_DEFINITIONS, mock_environment
from ..rag.embedding_rag import embedding_rag
from ..llm import groq_llm
from .state import AgentState


MAX_STEPS = 6

SYSTEM_PROMPT = """You are an AI IT Support Resolution Agent.

Use the retrieved SOP and approved tools to troubleshoot the employee's issue.

Rules:
1. Use only tools relevant to the ticket category.
2. Follow the retrieved SOP.
3. Verify the final state before resolving a ticket.
4. Never claim an issue is resolved without verification.
5. If remediation fails, escalate to the appropriate support team.
6. Do not perform unrelated actions.
"""


# Only these tools are permitted for each issue category.
ALLOWED_TOOLS = {
    "vpn": {
        "check_vpn_status",
        "check_certificate",
        "restart_vpn",
    },
    "password": {
        "check_password_status",
        "reset_password",
        "mock_login",
    },
}


def get_allowed_tool_definitions(issue_type: str) -> List[Dict[str, Any]]:
    """Return only the tools permitted for the identified issue type."""

    allowed_names = ALLOWED_TOOLS.get(issue_type, set())

    filtered_tools = []

    for definition in TOOL_DEFINITIONS:
        function_info = definition.get("function", {})
        tool_name = function_info.get("name")

        if tool_name in allowed_names:
            filtered_tools.append(definition)

    return filtered_tools


def retrieve_knowledge_node(state: AgentState) -> AgentState:
    """Retrieve relevant SOP knowledge using the embedding-based RAG system."""

    ticket = state.get("ticket", "")

    scored = embedding_rag.retrieve_scored(ticket)

    knowledge = []

    if scored:
        knowledge.append(scored[0]["content"])

    issue_type = "unknown"

    if scored:
        top_content = scored[0]["content"].lower()

        if "vpn" in top_content:
            issue_type = "vpn"
        elif "password" in top_content:
            issue_type = "password"
        elif "firewall" in top_content or "network" in top_content:
            issue_type = "network"
        elif "mfa" in top_content:
            issue_type = "mfa"
        elif "outage" in top_content:
            issue_type = "outage"

    events = list(state.get("events", []))

    events.append({
        "step": len(events) + 1,
        "event_type": "ticket_received",
        "description": f'Ticket received: "{ticket}"',
        "details": {"ticket": ticket},
    })

    retrieval_matches = [
        {
            "score": round(result["score"], 4),
            "content": result["content"][:200],
        }
        for result in scored
    ]

    if knowledge:
        events.append({
            "step": len(events) + 1,
            "event_type": "rag_retrieved",
            "description": (
                f"RAG retrieved {len(knowledge)} SOP article(s). "
                f"Top score: {retrieval_matches[0]['score']}. "
                f"Issue type: {issue_type.upper()}"
            ),
            "details": {
                "knowledge": knowledge,
                "issue_type": issue_type,
                "retrieval_matches": retrieval_matches,
            },
        })
    else:
        events.append({
            "step": len(events) + 1,
            "event_type": "rag_retrieved",
            "description": "No relevant SOP knowledge was retrieved.",
            "details": {
                "knowledge": [],
                "retrieval_matches": [],
            },
        })

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": (
                f"Employee Ticket: {ticket}\n\n"
                f"Retrieved SOP Knowledge:\n"
                f"{chr(10).join(knowledge) if knowledge else 'No matching SOP found.'}"
            ),
        },
    ]

    return {
        **state,
        "knowledge": knowledge,
        "issue_type": issue_type,
        "messages": messages,
        "events": events,
        "attempt_count": 0,
        "actions_taken": state.get("actions_taken", []),
        "tool_results": state.get("tool_results", []),
        "status": "IN_PROGRESS",
    }


def llm_reasoning_node(state: AgentState) -> AgentState:
    """Select the next approved tool or determine the final outcome."""

    events = list(state.get("events", []))
    knowledge = state.get("knowledge", [])
    issue_type = state.get("issue_type", "unknown")
    actions_taken = list(state.get("actions_taken", []))
    tool_results = list(state.get("tool_results", []))
    messages = list(state.get("messages", []))

    attempt_count = state.get("attempt_count", 0) + 1

    def escalate(reason: str, team: str = "Tier 2 IT Support") -> AgentState:
        events.append({
            "step": len(events) + 1,
            "event_type": "escalation",
            "description": f"{reason} Escalating to {team}.",
            "details": {
                "reason": reason,
                "team": team,
            },
        })

        return {
            **state,
            "status": "ESCALATE",
            "reason": reason,
            "resolution": None,
            "events": events,
            "attempt_count": attempt_count,
        }

    # Unsupported issue
    if not knowledge or issue_type == "unknown":
        return escalate(
            "No relevant SOP or approved automation is available."
        )

    # These categories require human support.
    escalation_teams = {
        "network": "Tier 2 Network Operations & Firewall Team",
        "mfa": "Tier 2 Information Security & IAM Team",
        "outage": "Tier 2/3 Incident Management Team",
    }

    if issue_type in escalation_teams:
        return escalate(
            f"Automated remediation is not enabled for {issue_type.upper()} issues.",
            escalation_teams[issue_type],
        )

    if issue_type not in ALLOWED_TOOLS:
        return escalate("Unsupported issue category.")

    # Do not start another tool if the action limit has been reached.
    # This does not prevent final verification after the last tool.
    if len(actions_taken) >= MAX_STEPS:
        return escalate(
            f"Maximum troubleshooting actions ({MAX_STEPS}) reached."
        )

    tool_name_to_call = None
    llm_decision_text = None

    # VPN: use Groq with VPN tools only.
    if issue_type == "vpn" and groq_llm.is_configured():
        try:
            allowed_definitions = get_allowed_tool_definitions(issue_type)

            response = groq_llm.chat_completion(
                messages=messages,
                tools=allowed_definitions,
                tool_choice="auto",
            )

            choice = response["choices"][0]["message"]

            if choice.get("tool_calls"):
                # Process one tool call at a time.
                tool_call = choice["tool_calls"][0]
                choice["tool_calls"] = [tool_call]

                requested_tool = tool_call["function"]["name"]

                if requested_tool in ALLOWED_TOOLS[issue_type]:
                    tool_name_to_call = requested_tool
                else:
                    llm_decision_text = None

            else:
                llm_decision_text = choice.get("content", "")

            messages.append(choice)

        except Exception as error:
            events.append({
                "step": len(events) + 1,
                "event_type": "llm_notice",
                "description": (
                    f"Groq LLM unavailable: {str(error)}. "
                    "Using deterministic troubleshooting."
                ),
            })

    # Deterministic fallback.
    # This also handles password tickets.
    if not tool_name_to_call and not llm_decision_text:

        if issue_type == "vpn":

            last_vpn_status = next(
                (
                    result
                    for result in reversed(tool_results)
                    if result.get("tool") == "check_vpn_status"
                ),
                None,
            )

            certificate_result = next(
                (
                    result
                    for result in reversed(tool_results)
                    if result.get("tool") == "check_certificate"
                ),
                None,
            )

            restart_result = next(
                (
                    result
                    for result in reversed(tool_results)
                    if result.get("tool") == "restart_vpn"
                ),
                None,
            )

            if last_vpn_status and last_vpn_status.get("status") == "connected":
                # Only resolve after remediation and a final status check.
                if restart_result and actions_taken.count("check_vpn_status") >= 2:
                    llm_decision_text = (
                        "STATUS: RESOLVED\n"
                        "VPN was successfully restarted and the connection "
                        "was verified as active."
                    )
                elif not restart_result:
                    llm_decision_text = (
                        "STATUS: RESOLVED\n"
                        "VPN connection is already active."
                    )
                else:
                    llm_decision_text = (
                        "STATUS: ESCALATE\n"
                        "VPN state could not be verified reliably."
                    )

            elif "check_vpn_status" not in actions_taken:
                tool_name_to_call = "check_vpn_status"

            elif not certificate_result:
                tool_name_to_call = "check_certificate"

            elif not certificate_result.get("certificate_valid", False):
                llm_decision_text = (
                    "STATUS: ESCALATE\n"
                    "VPN certificate is invalid or expired."
                )

            elif not restart_result:
                tool_name_to_call = "restart_vpn"

            elif not restart_result.get("success", False):
                llm_decision_text = (
                    "STATUS: ESCALATE\n"
                    "VPN restart failed."
                )

            elif actions_taken.count("check_vpn_status") < 2:
                tool_name_to_call = "check_vpn_status"

            else:
                llm_decision_text = (
                    "STATUS: ESCALATE\n"
                    "VPN remains disconnected after remediation."
                )

        elif issue_type == "password":

            password_status = next(
                (
                    result
                    for result in reversed(tool_results)
                    if result.get("tool") == "check_password_status"
                ),
                None,
            )

            reset_result = next(
                (
                    result
                    for result in reversed(tool_results)
                    if result.get("tool") == "reset_password"
                ),
                None,
            )

            if not password_status:
                tool_name_to_call = "check_password_status"

            elif password_status.get("password_status") == "active":
                temporary_password = getattr(
                    mock_environment,
                    "temp_password",
                    None,
                )

                if reset_result and reset_result.get("success"):
                    llm_decision_text = (
                        "STATUS: PENDING_LOGIN\n"
                        "Temporary password generated. "
                        "Employee must authenticate to verify."
                    )
                else:
                    llm_decision_text = (
                        "STATUS: ESCALATE\n"
                        "Account is already active. No password reset is needed."
                    )

            elif not reset_result:
                tool_name_to_call = "reset_password"

            elif not reset_result.get("success", False):
                llm_decision_text = (
                    "STATUS: ESCALATE\n"
                    "Password reset failed."
                )

            else:
                tool_name_to_call = "check_password_status"

    # Execute the selected tool in the next graph node.
    if tool_name_to_call:

        if tool_name_to_call not in ALLOWED_TOOLS[issue_type]:
            return escalate(
                f"Tool {tool_name_to_call} is not allowed for {issue_type}."
            )

        if len(actions_taken) >= MAX_STEPS:
            return escalate(
                f"Maximum troubleshooting actions ({MAX_STEPS}) reached."
            )

        events.append({
            "step": len(events) + 1,
            "event_type": "tool_selected",
            "description": f"Agent selected tool: {tool_name_to_call}()",
            "details": {"tool": tool_name_to_call},
        })

        return {
            **state,
            "last_tool_name": tool_name_to_call,
            "attempt_count": attempt_count,
            "events": events,
            "messages": messages,
        }

    # Password reset: wait for employee login.
    if llm_decision_text and "PENDING_LOGIN" in llm_decision_text.upper():

        reset_result = next(
            (
                result
                for result in reversed(tool_results)
                if result.get("tool") == "reset_password"
            ),
            None,
        )

        events.append({
            "step": len(events) + 1,
            "event_type": "verification",
            "description": (
                "Temporary password generated. Waiting for employee login."
            ),
            "details": {"verified": False},
        })

        return {
            **state,
            "status": "PENDING_LOGIN",
            "resolution": (
                "Temporary password generated successfully. "
                "Please log in using the displayed temporary password."
            ),
            "reason": None,
            "new_password": (
                reset_result.get("new_password")
                if reset_result
                else getattr(mock_environment, "temp_password", None)
            ),
            "events": events,
            "actions_taken": actions_taken,
            "tool_results": tool_results,
            "attempt_count": attempt_count,
            "verified": False,
        }

    # Escalation decision.
    if llm_decision_text and "ESCALATE" in llm_decision_text.upper():
        return escalate(
            llm_decision_text.replace("STATUS: ESCALATE", "").strip()
        )

    # Resolve only after the VPN's final status check confirms connection.
    if issue_type == "vpn":
        final_vpn_status = next(
            (
                result
                for result in reversed(tool_results)
                if result.get("tool") == "check_vpn_status"
            ),
            None,
        )

        restart_result = next(
            (
                result
                for result in reversed(tool_results)
                if result.get("tool") == "restart_vpn"
            ),
            None,
        )

        verified = (
            final_vpn_status is not None
            and final_vpn_status.get("status") == "connected"
            and (
                restart_result is None
                or restart_result.get("success", False)
            )
        )

        if verified:
            resolution_msg = (
                "VPN connection is active and has been successfully verified."
            )

            events.append({
                "step": len(events) + 1,
                "event_type": "verification",
                "description": "VPN connection verified as active.",
                "details": {"verified": True},
            })

            events.append({
                "step": len(events) + 1,
                "event_type": "resolved",
                "description": f"Ticket resolved: {resolution_msg}",
                "details": {"resolution": resolution_msg},
            })

            return {
                **state,
                "status": "RESOLVED",
                "resolution": resolution_msg,
                "reason": None,
                "events": events,
                "actions_taken": actions_taken,
                "tool_results": tool_results,
                "attempt_count": attempt_count,
                "verified": True,
            }

    return escalate("Agent could not establish a verified resolution.")


def tool_execution_node(state: AgentState) -> AgentState:
    """Execute the selected approved tool."""

    tool_name = state.get("last_tool_name")

    actions_taken = list(state.get("actions_taken", []))
    tool_results = list(state.get("tool_results", []))
    events = list(state.get("events", []))
    messages = list(state.get("messages", []))

    issue_type = state.get("issue_type", "unknown")

    # Validate tool name and category before execution.
    if (
        not tool_name
        or tool_name not in AVAILABLE_TOOLS
        or tool_name not in ALLOWED_TOOLS.get(issue_type, set())
    ):
        events.append({
            "step": len(events) + 1,
            "event_type": "escalation",
            "description": (
                f"Tool {tool_name} is not approved for {issue_type}."
            ),
        })

        return {
            **state,
            "status": "ESCALATE",
            "reason": "An unapproved tool was requested.",
            "events": events,
        }

    # Execute the mock tool.
    tool_func = AVAILABLE_TOOLS[tool_name]
    result = tool_func()

    actions_taken.append(tool_name)
    tool_results.append(result)

    result_summary = (
        result.get("status")
        or result.get("password_status")
        or ("success" if result.get("success") else "failed")
    )

    events.append({
        "step": len(events) + 1,
        "event_type": "tool_result",
        "description": (
            f"Tool result for {tool_name}: {result_summary}"
        ),
        "details": result,
    })

    # Match the tool result to the corresponding Groq tool call.
    tool_call_id = None

    for message in reversed(messages):
        if message.get("role") == "assistant":
            for tool_call in message.get("tool_calls", []):
                if tool_call.get("function", {}).get("name") == tool_name:
                    tool_call_id = tool_call.get("id")
                    break

            if tool_call_id:
                break

    if tool_call_id:
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "name": tool_name,
            "content": json.dumps(result),
        })
    else:
        messages.append({
            "role": "user",
            "content": (
                f"Tool {tool_name} executed. "
                f"Result: {json.dumps(result)}"
            ),
        })

    return {
        **state,
        "actions_taken": actions_taken,
        "tool_results": tool_results,
        "events": events,
        "messages": messages,
        "last_tool_name": None,
    }
