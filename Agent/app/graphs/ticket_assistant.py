"""工单协查 LangGraph"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from app.checkpoint import get_sqlite_saver
from app.docs import print_assist_progress
from app.nodes.ticket_assist import (
    TicketAssistState,
    agent_node,
    bump_tool_steps,
    finalize_node,
    load_ticket,
    route_after_agent,
)
from app.tools.assist_tools import ASSIST_TOOLS


def _pending_tool_names(state: TicketAssistState) -> list[str]:
    msgs = state.get("messages") or []
    last = msgs[-1] if msgs else None
    if not isinstance(last, AIMessage):
        return []
    names: list[str] = []
    for call in getattr(last, "tool_calls", None) or []:
        if isinstance(call, dict):
            name = call.get("name") or ""
        else:
            name = getattr(call, "name", "") or ""
        if name:
            names.append(str(name))
    return names


def _tools_and_bump(state: TicketAssistState) -> dict[str, Any]:
    """跑 tools，steps+1"""
    pending = _pending_tool_names(state)
    steps = int(state.get("tool_steps") or 0)
    print_assist_progress(
        node="tools",
        status="enter",
        tools=pending or None,
        tool_steps=steps,
        ticket_id=state.get("ticket_id"),
        thread_id=state.get("thread_id"),
    )
    tool_out = ToolNode(ASSIST_TOOLS).invoke(state)
    bumped = bump_tool_steps(state)
    out: dict[str, Any] = {}
    if isinstance(tool_out, dict):
        out.update(tool_out)
    out.update(bumped)
    print_assist_progress(
        node="tools",
        status="done",
        tools=pending or None,
        tool_steps=int(bumped.get("tool_steps") or steps + 1),
        next_route="agent",
        ticket_id=state.get("ticket_id"),
    )
    return out


def _build_graph():
    g = StateGraph(TicketAssistState)
    g.add_node("load_ticket", load_ticket)
    g.add_node("agent", agent_node)
    g.add_node("tools", _tools_and_bump)
    g.add_node("finalize", finalize_node)

    g.add_edge(START, "load_ticket")
    g.add_edge("load_ticket", "agent")
    g.add_conditional_edges(
        "agent",
        route_after_agent,
        {"tools": "tools", "finalize": "finalize"},
    )
    g.add_edge("tools", "agent")
    g.add_edge("finalize", END)
    return g.compile(checkpointer=get_sqlite_saver())


@lru_cache
def get_ticket_assist_graph():
    return _build_graph()


def run_ticket_assist(
    *,
    thread_id: str,
    ticket_id: int,
    ticket: dict[str, Any] | None,
    messages: list[Any] | None,
    operator_name: str | None = None,
) -> dict[str, Any]:
    """HTTP messages 进 ticket_messages，LLM 走 messages"""
    print_assist_progress(
        node="run",
        status="start",
        ticket_id=ticket_id,
        thread_id=thread_id,
        detail=f"operator={operator_name or 'admin'}",
    )
    graph = get_ticket_assist_graph()
    init: TicketAssistState = {
        "thread_id": thread_id,
        "ticket_id": ticket_id,
        "ticket": ticket or {},
        "ticket_messages": messages or [],
        "operator_name": operator_name or "admin",
    }
    final = graph.invoke(
        init,
        config={"configurable": {"thread_id": thread_id}},
    )
    print_assist_progress(
        node="run",
        status="end",
        ticket_id=ticket_id,
        thread_id=thread_id,
        tool_steps=int(final.get("tool_steps") or 0),
        detail=f"error={final.get('error') or ''}",
    )
    return dict(final)
