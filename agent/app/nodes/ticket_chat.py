from __future__ import annotations

from typing import Any, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.llm.siliconflow import build_chat_model
from app.rag.retrieve import format_citations, retrieve


class TicketChatState(TypedDict, total=False):
    thread_id: str
    ticket_id: int | None
    question: str
    audience: str
    ticket_context: str
    history: list[dict[str, str]]
    citations: list[dict[str, Any]]
    answer: str
    refused: bool
    message: str


CHAT_SYSTEM = """你是讯家出行运营侧协议问答助手。
只能依据提供的「协议检索片段」回答；不得编造未出现的条款。
若片段不足以回答，必须明确拒答，并说明缺少什么依据。
回答末尾用「引用：」列出用到的 [编号]。
不要承诺退款到账或自动改工单状态。
"""


def retrieve_node(state: TicketChatState) -> TicketChatState:
    audience = state.get("audience") or None
    if audience not in {"passenger", "driver"}:
        audience = None
    hits = retrieve(state.get("question") or "", top_k=4, audience=audience)
    return {**state, "citations": hits, "refused": len(hits) == 0}


def answer_node(state: TicketChatState) -> TicketChatState:
    citations = state.get("citations") or []
    if not citations:
        return {
            **state,
            "refused": True,
            "answer": "依据现有乘客/司机平台协议，未能检索到足够相关条款，无法给出确定答复。请改换问法，或人工核对协议原文。",
            "message": "refused: no citations",
        }

    llm = build_chat_model(temperature=0)
    history_msgs = []
    for item in (state.get("history") or [])[-6:]:
        role = item.get("role")
        content = item.get("content") or ""
        if role == "user":
            history_msgs.append(HumanMessage(content=content))
        elif role == "assistant":
            history_msgs.append(AIMessage(content=content))

    evidence = format_citations(citations)
    ticket_ctx = state.get("ticket_context") or "(无工单上下文)"
    prompt = (
        f"当前工单上下文：\n{ticket_ctx}\n\n"
        f"协议检索片段：\n{evidence}\n\n"
        f"运营问题：{state.get('question')}"
    )
    resp = llm.invoke(
        [SystemMessage(content=CHAT_SYSTEM), *history_msgs, HumanMessage(content=prompt)]
    )
    answer = getattr(resp, "content", "") or ""
    return {
        **state,
        "refused": False,
        "answer": answer,
        "message": "chat ok",
    }
