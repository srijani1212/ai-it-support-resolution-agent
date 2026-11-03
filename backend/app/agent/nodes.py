
import json
from typing import Dict, Any, List, Optional

from ..tools import AVAILABLE_TOOLS, TOOL_DEFINITIONS, mock_environment
from ..rag.embedding_rag import embedding_rag
from ..llm import groq_llm
from .state import AgentState


MAX_STEPS = 6


SYSTEM_PROMPT = """You are an AI IT Support Resolution Agent.
Your role is to troubleshoot and resolve employee IT issues using ONLY the approved tools and retrieved Standard Operating Procedures (SOPs).

CORE RULES:
1. Always follow the retrieved SOP knowledge.
2. Use tool calling to inspect state, remediate, and verify.
3. NEVER claim RESOLVED without verifying state with a check tool.
4. If a tool fails (e.g. restart_vpn fails) and check_certificate shows invalid/expired certificate, there is no certificate repair tool, so you MUST formulate an ESCALATE decision.
5. If the issue is unsupported (no relevant SOP knowledge), immediately formulate an ESCALATE decision.
6. When done, output either 'STATUS: RESOLVED' with a clear resolution summary or 'STATUS: ESCALATE' with the escalation reason.
"""


def retrieve_knowledge_node(state: AgentState) -> AgentState:
    """RAG Node: Retrieve the most relevant SOP knowledge using embeddings."""

    ticket = state.get("ticket", "")

    # Retrieve the most relevant SOPs using embeddings
    scored = embedding_rag.retrieve_scored(ticket)

    # Only use the top-ranked SOP
    knowledge: List[str] = []

    if scored:
        knowledge.append(scored[0]["content"])

    # Determine issue type from the top-ranked retrieved SOP
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

    top_matches = [
        {
            "score": round(result["score"], 4),
            "content": result["content"][:200],
        }
        for result in scored
    ]

    events = list(state.get("events", []))

    events.append(
        {
            "step": len(events) + 1,
            "event_type": "ticket_received",
            "description": f'Ticket received: "{ticket}"',
            "details": {"ticket": ticket},
        }
    )

    if knowledge:
        events.append(
            {
                "step": len(events) + 1,
                "event_type": "rag_retrieved",
                "description": (
                    f"RAG retrieved {len(knowledge)} SOP article(s) "
                    f"using embedding similarity "
                    f"(top score: {top_matches[0]['score']}) "
                    f"for issue type: {issue_type.upper()}"
                ),
                "details": {
                    "knowledge": knowledge,
                    "issue_type": issue_type,
                    "retrieval_matches": top_matches,
                },
            }
        )
    else:
        events.append(
            {
                "step": len(events) + 1,
                "event_type": "rag_retrieved",
                "description": "No relevant SOP knowledge was retrieved.",
                "details": {
                    "knowledge": [],
                    "retrieval_matches": [],
                },
            }
        )

    # Give only the top-ranked SOP knowledge to the LLM
    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": (
                f"Employee Ticket: {ticket}\n\n"
                "Retrieved SOP Knowledge:\n"
                + (
                    "\n\n".join(knowledge)
                    if knowledge
                    else "No matching SOP found."
                )
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
    """LLM Node: Uses Groq Llama 3.3 70B or deterministic fallback."""

    attempt_count = state.get("attempt_count", 0) + 1
    events = list(state.get("events", []))
    knowledge = state.get("knowledge", [])
    issue_type = state.get("issue_type", "unknown")
    actions_taken = list(state.get("actions_taken", []))
    tool_results = list(state.get("tool_results", []))
    messages = list(state.get("messages", []))

    # Guard: Unsupported issue
    if not knowledge or issue_type == "unknown":
        events.append(
            {
                "step": len(events) + 1,
                "event_type": "escalation",
                "description": (
                    "No approved runbook or tool available for this issue. "
                    "Escalating to Tier 2 IT Support."
                ),
                "details": {"reason": "Unsupported issue category"},
            }
        )

        return {
            **state,
            "status": "ESCALATE",
            "reason": (
                "Unsupported issue type. No relevant knowledge base "
                "article or automation tool exists for this ticket."
            ),
            "resolution": None,
            "events": events,
            "attempt_count": attempt_count,
        }

    # Only these issue types can be automatically resolved
    AUTOMATABLE_ISSUE_TYPES = {"vpn", "password"}

    if issue_type not in AUTOMATABLE_ISSUE_TYPES:
        tier_map = {
            "network": "Tier 2 Network Operations & Firewall Team",
            "mfa": "Tier 2 Information Security & IAM Team",
            "outage": "Tier 2/3 Incident Management Team",
        }

        tier_target = tier_map.get(
            issue_type,
            "Tier 2 IT Helpdesk",
        )

        reason = (
            f"A matching SOP was found for issue type "
            f"'{issue_type.upper()}', but this category is outside "
            f"Level-1 AI automated remediation authority "
            f"(only password resets and VPN reconnections are automated). "
            f"Escalating to {tier_target}."
        )

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "escalation",
                "description": reason,
                "details": {
                    "reason": reason,
                    "issue_type": issue_type,
                    "tier": tier_target,
                },
            }
        )

        return {
            **state,
            "status": "ESCALATE",
            "reason": reason,
            "resolution": None,
            "events": events,
            "attempt_count": attempt_count,
        }

    # Guard: Maximum step limit
    if attempt_count > MAX_STEPS:
        events.append(
            {
                "step": len(events) + 1,
                "event_type": "escalation",
                "description": (
                    f"Exceeded maximum troubleshooting threshold "
                    f"({MAX_STEPS} steps). Escalating to human IT specialist."
                ),
                "details": {"attempt_count": attempt_count},
            }
        )

        return {
            **state,
            "status": "ESCALATE",
            "reason": (
                f"Maximum troubleshooting attempts ({MAX_STEPS}) "
                f"reached without definitive resolution."
            ),
            "resolution": None,
            "events": events,
            "attempt_count": attempt_count,
        }

    # Try live Groq LLM if configured
    tool_name_to_call = None
    llm_decision_text = None

    if issue_type != "password" and groq_llm.is_configured():
        try:
            response = groq_llm.chat_completion(
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
            )

            choice = response["choices"][0]["message"]
            messages.append(choice)

            if "tool_calls" in choice and choice["tool_calls"]:
                tool_call = choice["tool_calls"][0]
                tool_name_to_call = tool_call["function"]["name"]
            else:
                llm_decision_text = choice.get("content", "")

        except Exception as e:
            events.append(
                {
                    "step": len(events) + 1,
                    "event_type": "escalation",
                    "description": (
                        f"Groq LLM connection notice ({str(e)}). "
                        "Proceeding with resilient deterministic "
                        "tool-calling engine."
                    ),
                }
            )

    # Deterministic fallback tool-calling engine
    if not tool_name_to_call and not llm_decision_text:

        if issue_type == "vpn":

            # Step 1: Check current VPN connection
            if "check_vpn_status" not in actions_taken:
                tool_name_to_call = "check_vpn_status"

            # Step 2: Check certificate BEFORE remediation
            elif "check_certificate" not in actions_taken:

                vpn_status = next(
                    (
                        r
                        for r in reversed(tool_results)
                        if r.get("tool") == "check_vpn_status"
                    ),
                    None,
                )

                if vpn_status and vpn_status.get("status") == "connected":
                    llm_decision_text = (
                        "STATUS: RESOLVED\n"
                        "VPN connection is already active and operational."
                    )
                else:
                    tool_name_to_call = "check_certificate"

            # Step 3: Certificate valid → restart VPN
            elif "restart_vpn" not in actions_taken:

                cert_res = next(
                    (
                        r
                        for r in reversed(tool_results)
                        if r.get("tool") == "check_certificate"
                    ),
                    None,
                )

                if cert_res and not cert_res.get(
                    "certificate_valid",
                    False,
                ):
                    llm_decision_text = (
                        "STATUS: ESCALATE\n"
                        "VPN client certificate is expired or invalid. "
                        "No automated certificate renewal tool is available. "
                        "Escalating to Tier 2 PKI & Network Operations."
                    )
                else:
                    tool_name_to_call = "restart_vpn"

            # Step 4: Restart happened → verify VPN
            elif actions_taken.count("check_vpn_status") < 2:

                restart_res = next(
                    (
                        r
                        for r in reversed(tool_results)
                        if r.get("tool") == "restart_vpn"
                    ),
                    None,
                )

                if restart_res and not restart_res.get(
                    "success",
                    False,
                ):
                    llm_decision_text = (
                        "STATUS: ESCALATE\n"
                        "VPN restart failed. Escalating to Network Operations."
                    )
                else:
                    tool_name_to_call = "check_vpn_status"

            # Step 5: Final verification
            else:

                last_status = (
                    tool_results[-1].get("status")
                    if tool_results
                    else ""
                )

                if last_status == "connected":
                    llm_decision_text = (
                        "STATUS: RESOLVED\n"
                        "VPN service was successfully restarted and "
                        "the tunnel connection was verified as active."
                    )
                else:
                    llm_decision_text = (
                        "STATUS: ESCALATE\n"
                        "VPN remains disconnected after remediation. "
                        "Escalating to Tier 2 Network Support."
                    )

        elif issue_type == "password":

            # Step 1: Check the employee's current password status.
            if "check_password_status" not in actions_taken:
                tool_name_to_call = "check_password_status"

            # Step 2: Reset the password if it is not already active.
            elif "reset_password" not in actions_taken:

                password_status = next(
                    (
                        r
                        for r in reversed(tool_results)
                        if r.get("tool") == "check_password_status"
                    ),
                    None,
                )

                if (
                    password_status
                    and password_status.get("password_status") == "active"
                ):
                    temporary_password = getattr(
                        mock_environment,
                        "temp_password",
                        None,
                    )

                    if temporary_password:
                        llm_decision_text = (
                            "STATUS: PENDING_LOGIN\n"
                            "The account is active. Please enter the temporary "
                            "password to verify employee login."
                        )
                    else:
                        llm_decision_text = (
                            "STATUS: ESCALATE\n"
                            "The account is already active, but no temporary "
                            "password is available. Escalating to the IAM Team."
                        )

                else:
                    tool_name_to_call = "reset_password"

            # Step 3: After reset, check the password status again.
            elif "check_password_status" not in actions_taken[-1:]:

                reset_result = next(
                    (
                        r
                        for r in reversed(tool_results)
                        if r.get("tool") == "reset_password"
                    ),
                    None,
                )

                if reset_result and not reset_result.get("success", False):
                    llm_decision_text = (
                        "STATUS: ESCALATE\n"
                        "Password reset failed. Escalating to the IAM Team."
                    )
                else:
                    tool_name_to_call = "check_password_status"

            # Step 4: Stop and wait for employee login.
            else:

                final_status = next(
                    (
                        r
                        for r in reversed(tool_results)
                        if r.get("tool") == "check_password_status"
                    ),
                    None,
                )

                if (
                    not final_status
                    or final_status.get("password_status") != "active"
                ):
                    llm_decision_text = (
                        "STATUS: ESCALATE\n"
                        "Password reset did not produce an active account. "
                        "Escalating to the IAM Team."
                    )
                else:
                    llm_decision_text = (
                        "STATUS: PENDING_LOGIN\n"
                        "Your temporary password has been generated. "
                        "Please enter it in the login form to verify your account."
                    )

    # Process tool execution request
    if tool_name_to_call:

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "tool_selected",
                "description": (
                    f"Agent selected tool: {tool_name_to_call}()"
                ),
                "details": {"tool": tool_name_to_call},
            }
        )

        return {
            **state,
            "last_tool_name": tool_name_to_call,
            "attempt_count": attempt_count,
            "events": events,
            "messages": messages,
        }

    # Handle password reset completion without automatically logging in.
    if (
        llm_decision_text
        and "PENDING_LOGIN" in llm_decision_text.upper()
    ):

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "verification",
                "description": (
                    "Password reset completed. Waiting for employee to enter "
                    "the temporary password and verify login."
                ),
                "details": {"verified": False},
            }
        )

        reset_result = next(
            (
                r
                for r in reversed(tool_results)
                if r.get("tool") == "reset_password"
            ),
            None,
        )

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

    # Evaluate final text decision
    if llm_decision_text and "ESCALATE" in llm_decision_text.upper():

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "escalation",
                "description": (
                    "Agent decided to ESCALATE: "
                    + llm_decision_text.replace(
                        "STATUS: ESCALATE",
                        "",
                    ).strip()
                ),
                "details": {"reason": llm_decision_text},
            }
        )

        return {
            **state,
            "status": "ESCALATE",
            "reason": (
                llm_decision_text.replace(
                    "STATUS: ESCALATE",
                    "",
                ).strip()
                or "Escalated by AI resolution agent policy."
            ),
            "resolution": None,
            "events": events,
            "actions_taken": actions_taken,
            "tool_results": tool_results,
            "attempt_count": attempt_count,
        }

    elif llm_decision_text:

        resolution_msg = (
            llm_decision_text.replace(
                "STATUS: RESOLVED",
                "",
            ).strip()
            if llm_decision_text
            else "Issue resolved and verified successfully."
        )

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "verification",
                "description": (
                    "Verification successful: Target state confirmed "
                    "in mock environment."
                ),
                "details": {"verified": True},
            }
        )

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "resolved",
                "description": (
                    f"Agent marked ticket as RESOLVED: {resolution_msg}"
                ),
                "details": {"resolution": resolution_msg},
            }
        )

        return {
            **state,
            "status": "RESOLVED",
            "resolution": resolution_msg,
            "reason": (
                "All troubleshooting actions executed and "
                "post-remediation state verified."
            ),
            "events": events,
            "actions_taken": actions_taken,
            "tool_results": tool_results,
            "attempt_count": attempt_count,
            "verified": True,
        }

    else:

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "escalation",
                "description": (
                    "LLM reasoning node reached without a clear decision. "
                    "Escalating to human."
                ),
                "details": {
                    "reason": "No clear resolution or tool selection path"
                },
            }
        )

        return {
            **state,
            "status": "ESCALATE",
            "reason": (
                "No clear resolution or tool selection path determined."
            ),
            "resolution": None,
            "events": events,
            "attempt_count": attempt_count,
        }


def tool_execution_node(state: AgentState) -> AgentState:
    """Tool Node: Executes the chosen mock tool against the in-memory environment."""

    tool_name = state.get("last_tool_name")
    actions_taken = list(state.get("actions_taken", []))
    tool_results = list(state.get("tool_results", []))
    events = list(state.get("events", []))
    messages = list(state.get("messages", []))

    if not tool_name or tool_name not in AVAILABLE_TOOLS:

        events.append(
            {
                "step": len(events) + 1,
                "event_type": "escalation",
                "description": (
                    f"Unknown tool requested: {tool_name}. "
                    "Escalating."
                ),
            }
        )

        return {
            **state,
            "status": "ESCALATE",
            "reason": (
                f"Tool '{tool_name}' is not recognized "
                "in approved tool catalog."
            ),
            "events": events,
        }

    # Execute the tool
    tool_func = AVAILABLE_TOOLS[tool_name]
    result = tool_func()

    actions_taken.append(tool_name)
    tool_results.append(result)

    # Format concise observable event
    res_str = (
        result.get("status")
        or result.get("password_status")
        or ("success" if result.get("success") else "failed")
    )

    events.append(
        {
            "step": len(events) + 1,
            "event_type": "tool_result",
            "description": (
                f"Tool result for {tool_name}: {res_str}"
            ),
            "details": result,
        }
    )

    # Append tool result to LLM context
    messages.append(
        {
            "role": "tool",
            "name": tool_name,
            "content": json.dumps(result),
        }
    )

    return {
        **state,
        "actions_taken": actions_taken,
        "tool_results": tool_results,
        "events": events,
        "messages": messages,
        "last_tool_name": None,
    }
