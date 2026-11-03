from typing import Dict, Any, Literal
from .state import AgentState
from .nodes import retrieve_knowledge_node, llm_reasoning_node, tool_execution_node
from ..tools import mock_environment
from ..models.schemas import AgentResponse, AgentActivityEvent, EnvironmentState

# Try importing LangGraph; if not installed yet in sandbox, provide standard compliant graph runner
try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    END = "__end__"

def route_after_llm(state: AgentState) -> Literal["tool_node", "__end__"]:
    status = state.get("status")
    if status in ["RESOLVED", "ESCALATE"]:
        return "__end__"
    if state.get("last_tool_name"):
        return "tool_node"
    return "__end__"

def build_langgraph_workflow():
    """Builds and compiles the LangGraph StateGraph."""
    if not LANGGRAPH_AVAILABLE:
        return None

    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("rag_node", retrieve_knowledge_node)
    workflow.add_node("llm_node", llm_reasoning_node)
    workflow.add_node("tool_node", tool_execution_node)

    # Set Entry Point
    workflow.set_entry_point("rag_node")

    # Connect RAG to LLM
    workflow.add_edge("rag_node", "llm_node")

    # Conditional Routing from LLM
    workflow.add_conditional_edges(
        "llm_node",
        route_after_llm,
        {
            "tool_node": "tool_node",
            "__end__": END
        }
    )

    # Loop back from Tool to LLM
    workflow.add_edge("tool_node", "llm_node")

    return workflow.compile()

# Fallback graph execution engine for standard python environments
def execute_graph_manually(initial_state: AgentState) -> AgentState:
    state = retrieve_knowledge_node(initial_state)
    while True:
        state = llm_reasoning_node(state)
        next_step = route_after_llm(state)
        if next_step == "__end__":
            break
        state = tool_execution_node(state)
    return state

# Compiled graph singleton if available
compiled_graph = build_langgraph_workflow() if LANGGRAPH_AVAILABLE else None

def run_agent(ticket: str) -> AgentResponse:
    """Executes the AI IT Support Resolution Agent on an employee ticket."""
    initial_state: AgentState = {
        "ticket": ticket,
        "actions_taken": [],
        "tool_results": [],
        "events": [],
        "status": "IN_PROGRESS",
        "attempt_count": 0,
        "verified": False,
    }

    if compiled_graph:
        final_state = compiled_graph.invoke(initial_state)
    else:
        final_state = execute_graph_manually(initial_state)

    env_state_dict = mock_environment.get_state()
    env_state = EnvironmentState(**env_state_dict)

    events_list = [
        AgentActivityEvent(
            step=e.get("step", idx + 1),
            event_type=e.get("event_type", "resolved"),
            description=e.get("description", ""),
            details=e.get("details"),
        )
        for idx, e in enumerate(final_state.get("events", []))
    ]

    return AgentResponse(
        status=final_state.get("status", "ESCALATE"),
        resolution=final_state.get("resolution"),
        actions_taken=final_state.get("actions_taken", []),
        reason=final_state.get("reason", ""),
        tool_results=final_state.get("tool_results", []),
        knowledge=final_state.get("knowledge", []),
        events=events_list,
        environment_state=env_state,
        new_password=mock_environment.temp_password,

    )
