from __future__ import annotations

from openai import OpenAI

from app.config import Settings, get_settings


def build_embed_client(settings: Settings | None = None) -> OpenAI:
    s = settings or get_settings()
    if not s.siliconflow_ready:
        raise RuntimeError("SILICONFLOW_API_KEY is empty")
    return OpenAI(api_key=s.siliconflow_api_key, base_url=s.siliconflow_base_url)


def embed_texts(texts: list[str], settings: Settings | None = None) -> list[list[float]]:
    if not texts:
        return []
    s = settings or get_settings()
    client = build_embed_client(s)
    # SiliconFlow OpenAI-compatible embeddings
    resp = client.embeddings.create(model=s.siliconflow_embed_model, input=texts)
    # ensure order by index
    data = sorted(resp.data, key=lambda x: x.index)
    return [list(item.embedding) for item in data]


def embed_query(text: str, settings: Settings | None = None) -> list[float]:
    vectors = embed_texts([text], settings)
    return vectors[0]
