from __future__ import annotations

import httpx
from fastapi import APIRouter

from app.checkpoint import checkpoint_status, ensure_checkpoint_dir
from app.config import get_settings
from app.docs import describe_assist_schema, describe_assist_tools
from app.observability import get_langfuse, trace_span
from app.tools import ASSIST_TOOLS

router = APIRouter(tags=["health"])


def _check_qdrant() -> dict:
    settings = get_settings()
    try:
        headers = {}
        if settings.qdrant_api_key:
            headers["api-key"] = settings.qdrant_api_key
        with httpx.Client(timeout=2.0) as client:
            resp = client.get(f"{settings.qdrant_url.rstrip('/')}/readyz", headers=headers)
            ok = resp.status_code == 200
            return {
                "ok": ok,
                "url": settings.qdrant_url,
                "status_code": resp.status_code,
            }
    except Exception as exc:
        return {
            "ok": False,
            "url": settings.qdrant_url,
            "error": str(exc),
        }


@router.get("/health")
def health():
    settings = get_settings()
    ensure_checkpoint_dir()

    with trace_span("agent.health", metadata={"env": settings.app_env}):
        qdrant = _check_qdrant()
        return {
            "status": "ok",
            "service": "xunjia-ticket-agent",
            "phase": 5,
            "env": settings.app_env,
            "port": settings.agent_port,
            "siliconflow": {
                "configured": settings.siliconflow_ready,
                "base_url": settings.siliconflow_base_url,
                "chat_model": settings.siliconflow_chat_model,
                "embed_model": settings.siliconflow_embed_model,
            },
            "langfuse": {
                "configured": settings.langfuse_ready,
                "host": settings.langfuse_host,
                "client_ready": get_langfuse() is not None,
            },
            "qdrant": qdrant,
            "checkpoint": checkpoint_status(),
            "assist_schema": describe_assist_schema(),
            "assist_tools": {
                "count": len(ASSIST_TOOLS),
                "max_tool_steps": settings.assist_max_tool_steps,
                "java_tools_enabled": settings.java_tools_enabled,
                "items": describe_assist_tools(ASSIST_TOOLS),
            },
            "java_services": {
                "order": settings.java_order_base_url,
                "price": settings.java_price_base_url,
                "driver": settings.java_driver_base_url,
                "ticket": settings.java_ticket_base_url,
                "internal_token_configured": bool(settings.java_internal_token.strip()),
            },
        }


@router.post("/health/langfuse-ping")
def langfuse_ping():
    """Emit one Trace to Langfuse Cloud (no-op if keys empty)."""
    client = get_langfuse()
    if client is None:
        return {
            "ok": False,
            "message": "Langfuse not configured; fill LANGFUSE_* in .env",
        }
    with trace_span("agent.langfuse_ping", metadata={"phase": 0}):
        pass
    return {"ok": True, "message": "trace flushed; check Langfuse dashboard"}
