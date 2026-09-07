from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.graphs.ticket_assistant import run_ticket_assist
from app.graphs.ticket_chat import run_ticket_chat
from app.observability import trace_span, update_observation
from app.rag.ingest import ingest_knowledge

router = APIRouter(prefix="/v1/ticket", tags=["ticket-agent"])


class TicketAssistRequest(BaseModel):
    thread_id: str
    ticket_id: int
    user_type: str = "ADMIN"
    user_id: int | None = None
    operator_name: str | None = None
    agent_scene: str = "TICKET_ASSIST"
    ticket: dict[str, Any] | None = None
    messages: list[Any] = Field(default_factory=list)


class TicketChatRequest(BaseModel):
    thread_id: str
    question: str
    ticket_id: int | None = None
    user_type: str = "ADMIN"
    user_id: int | None = None
    operator_name: str | None = None
    audience: str | None = None
    ticket_context: str | None = None
    history: list[dict[str, str]] = Field(default_factory=list)


@router.post("/assist")
def ticket_assist(body: TicketAssistRequest):
    """LangGraph assist + RAG + refund/execute advice (phase 4)."""
    ticket = body.ticket or {}
    with trace_span(
        "agent.ticket_assist",
        metadata={
            "thread_id": body.thread_id,
            "ticket_id": body.ticket_id,
            "user_type": body.user_type,
            "category": ticket.get("category"),
            "has_order": bool(ticket.get("orderId") or ticket.get("order_id")),
            "phase": 4,
        },
        input={"ticket_id": body.ticket_id, "category": ticket.get("category")},
    ) as span:
        try:
            final = run_ticket_assist(
                thread_id=body.thread_id,
                ticket_id=body.ticket_id,
                ticket=body.ticket,
                messages=body.messages,
                operator_name=body.operator_name,
            )
        except Exception as exc:
            update_observation(span, output={"error": str(exc)})
            raise HTTPException(status_code=502, detail=f"assist failed: {exc}") from exc

        suggestion = final.get("suggestion") or {}
        summary = final.get("summary") or suggestion.get("summary") or ""
        err = final.get("error") or ""
        payload = {
            "phase": 4,
            "echo": False,
            "thread_id": body.thread_id,
            "ticket_id": body.ticket_id,
            "message": "assist ok" if not err else f"assist partial: {err}",
            "summary": summary,
            "suggestion": suggestion,
            "citations": final.get("policy_citations") or [],
            "server_time": datetime.utcnow().isoformat() + "Z",
        }
        update_observation(
            span,
            output={
                "summary": summary[:300],
                "actions": suggestion.get("recommended_actions"),
                "refund": (suggestion.get("refund_advice") or {}).get("suggest_refund"),
                "execute": (suggestion.get("execute_advice") or {}).get("suggest_approve"),
                "confidence": suggestion.get("confidence"),
            },
        )
        return payload


@router.post("/chat")
def ticket_chat(body: TicketChatRequest):
    """Multi-turn policy RAG chat on the same thread_id."""
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=400, detail="question required")

    with trace_span(
        "agent.ticket_chat",
        metadata={
            "thread_id": body.thread_id,
            "ticket_id": body.ticket_id,
            "audience": body.audience,
            "phase": 4,
        },
        input={"question": body.question[:200]},
    ) as span:
        try:
            final = run_ticket_chat(
                thread_id=body.thread_id,
                question=body.question.strip(),
                ticket_id=body.ticket_id,
                audience=body.audience,
                ticket_context=body.ticket_context,
                history=body.history,
            )
        except Exception as exc:
            update_observation(span, output={"error": str(exc)})
            raise HTTPException(status_code=502, detail=f"chat failed: {exc}") from exc

        payload = {
            "phase": 4,
            "thread_id": body.thread_id,
            "ticket_id": body.ticket_id,
            "refused": bool(final.get("refused")),
            "answer": final.get("answer") or "",
            "citations": final.get("citations") or [],
            "message": final.get("message") or "chat ok",
            "server_time": datetime.utcnow().isoformat() + "Z",
        }
        update_observation(
            span,
            output={
                "refused": payload["refused"],
                "citation_count": len(payload["citations"]),
                "answer_preview": (payload["answer"] or "")[:200],
            },
        )
        return payload


@router.post("/knowledge/ingest")
def knowledge_ingest(recreate: bool = True):
    """Admin utility: rebuild Qdrant collection from knowledge/*.md"""
    try:
        result = ingest_knowledge(recreate=recreate)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not result.get("ok"):
        raise HTTPException(status_code=400, detail=result.get("message") or "ingest failed")
    return result
