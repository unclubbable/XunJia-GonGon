from __future__ import annotations

from openai import OpenAI
from langchain_openai import ChatOpenAI

from app.config import Settings, get_settings


def build_openai_client(settings: Settings | None = None) -> OpenAI:
    """SiliconFlow OpenAI-compatible client."""
    s = settings or get_settings()
    if not s.siliconflow_ready:
        raise RuntimeError("SILICONFLOW_API_KEY is empty; fill Agent/.env")
    return OpenAI(
        api_key=s.siliconflow_api_key,
        base_url=s.siliconflow_base_url,
    )


def build_chat_model(settings: Settings | None = None, temperature: float = 0) -> ChatOpenAI:
    s = settings or get_settings()
    if not s.siliconflow_ready:
        raise RuntimeError("SILICONFLOW_API_KEY is empty; fill Agent/.env")
    return ChatOpenAI(
        model=s.siliconflow_chat_model,
        api_key=s.siliconflow_api_key,
        base_url=s.siliconflow_base_url,
        temperature=temperature,
        seed=123,
    )


def ping_chat_model(settings: Settings | None = None) -> str:
    """Minimal connectivity check; returns model id used."""
    s = settings or get_settings()
    client = build_openai_client(s)
    resp = client.chat.completions.create(
        model=s.siliconflow_chat_model,
        messages=[{"role": "user", "content": "ping"}],
        max_tokens=8,
        temperature=0,
    )
    _ = resp.choices[0].message.content
    return s.siliconflow_chat_model
