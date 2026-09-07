"""Uvicorn entry: python run.py"""

import uvicorn

from app.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.agent_host,
        port=settings.agent_port,
        reload=settings.app_env == "dev",
    )


if __name__ == "__main__":
    main()
