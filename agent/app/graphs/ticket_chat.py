from __future__ import annotations

from functools import lru_cache
from typing import Any

from langgraph.graph import END, START, StateGraph

from app.checkpoint import get_sqlite_saver
from app.nodes.ticket_chat import TicketChatState, answer_node, retrieve_node


def _build_graph():
    g = StateGraph(TicketChatState)
    g.add_node("retrieve", retrieve_node)
    g.add_node("answer", answer_node)
    g.add_edge(START, "retrieve")
    g.add_edge("retrieve", "answer")
    g.add_edge("answer", END)
    return g.compile(checkpointer=get_sqlite_saver())


@lru_cache
def get_ticket_chat_graph():
    return _build_graph()


def run_ticket_chat(
    *,
    thread_id: str,
    question: str,
    ticket_id: int | None = None,
    audience: str | None = None,
    ticket_context: str | None = None,
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    graph = get_ticket_chat_graph()
    init: TicketChatState = {
        "thread_id": thread_id,
        "ticket_id": ticket_id,
        "question": question,
        "audience": audience or "",
        "ticket_context": ticket_context or "",
        "history": history or [],
    }
    final = graph.invoke(init, config={"configurable": {"thread_id": thread_id}})
    return dict(final)
