from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    agent_host: str = "0.0.0.0"
    agent_port: int = 18080
    app_env: str = "dev"

    siliconflow_api_key: str = ""
    siliconflow_base_url: str = "https://api.siliconflow.cn/v1"
    siliconflow_chat_model: str = "deepseek-ai/DeepSeek-V3"
    siliconflow_embed_model: str = "BAAI/bge-m3"

    checkpoint_sqlite_path: str = "./data/checkpoints.sqlite"

    qdrant_url: str = "http://127.0.0.1:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "ticket_agent_knowledge"

    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"
    langfuse_enabled: bool = True

    java_internal_base_url: str = "http://127.0.0.1:7071"
    java_internal_token: str = ""
    # Direct microservice bases (bypass gateway JWT). Empty => fall back unused.
    java_tools_enabled: bool = True
    java_http_timeout: float = 12.0
    java_order_base_url: str = "http://127.0.0.1:8087"
    java_price_base_url: str = "http://127.0.0.1:8084"
    java_driver_base_url: str = "http://127.0.0.1:8086"
    java_ticket_base_url: str = "http://127.0.0.1:8091"
    java_map_base_url: str = "http://127.0.0.1:8085"
    assist_max_tool_steps: int = 5

    @property
    def checkpoint_path(self) -> Path:
        path = Path(self.checkpoint_sqlite_path)
        if not path.is_absolute():
            path = ROOT_DIR / path
        return path

    @property
    def siliconflow_ready(self) -> bool:
        return bool(self.siliconflow_api_key.strip())

    @property
    def langfuse_ready(self) -> bool:
        return (
            self.langfuse_enabled
            and bool(self.langfuse_public_key.strip())
            and bool(self.langfuse_secret_key.strip())
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
