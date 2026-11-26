from __future__ import annotations

from functools import lru_cache

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.config import Settings, get_settings


@lru_cache
def get_qdrant_client() -> QdrantClient:
    s = get_settings()
    kwargs = {"url": s.qdrant_url, "prefer_grpc": False, "check_compatibility": False}
    if s.qdrant_api_key:
        kwargs["api_key"] = s.qdrant_api_key
    return QdrantClient(**kwargs)


def ensure_collection(vector_size: int, settings: Settings | None = None) -> str:
    s = settings or get_settings()
    client = get_qdrant_client()
    name = s.qdrant_collection
    exists = False
    try:
        info = client.get_collection(name)
        exists = info is not None
    except Exception:
        exists = False
    if not exists:
        client.create_collection(
            collection_name=name,
            vectors_config=qmodels.VectorParams(
                size=vector_size,
                distance=qmodels.Distance.COSINE,
            ),
        )
    return name
