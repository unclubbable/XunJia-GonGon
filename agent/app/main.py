from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import health_router
from app.api.ticket_agent import router as ticket_agent_router
from app.checkpoint import ensure_checkpoint_dir
from app.config import get_settings
from app.docs import print_assist_schema


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_checkpoint_dir()
    print_assist_schema(include_tools=True)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="讯家出行 Ticket Agent",
        description="企业工单 Agent 服务（Java 调 Python）",
        version="0.6.0-phase5",
        lifespan=lifespan,
    )
    app.include_router(health_router)
    app.include_router(ticket_agent_router)

    @app.get("/")
    def root():
        return {
            "service": "xunjia-ticket-agent",
            "phase": 5,
            "docs": "/docs",
            "health": "/health",
            "assist": "POST /v1/ticket/assist",
            "chat": "POST /v1/ticket/chat",
            "ingest": "POST /v1/ticket/knowledge/ingest",
            "port": settings.agent_port,
            "assist_graph": "load_ticket -> agent <-> tools -> finalize",
        }

    return app


app = create_app()
