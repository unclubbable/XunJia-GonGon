from __future__ import annotations

from typing import Any

from qdrant_client.http import models as qmodels

from app.config import get_settings
from app.rag.embeddings import embed_query
from app.rag.store import get_qdrant_client

DEFAULT_SCORE_THRESHOLD = 0.45


def retrieve(
    query: str,
    *,
    top_k: int = 4,
    audience: str | None = None,
    score_threshold: float = DEFAULT_SCORE_THRESHOLD,
) -> list[dict[str, Any]]:
    """有分才返回，否则空"""
    if not query or not query.strip():
        return []
    settings = get_settings()
    client = get_qdrant_client()
    vector = embed_query(query.strip(), settings)

    query_filter = None
    if audience in {"passenger", "driver"}:
        query_filter = qmodels.Filter(
            must=[qmodels.FieldCondition(key="audience", match=qmodels.MatchValue(value=audience))]
        )

    try:
        points = client.query_points(
            collection_name=settings.qdrant_collection,
            query=vector,
            query_filter=query_filter,
            limit=top_k,
            with_payload=True,
        ).points
    except Exception:
        return []

    results: list[dict[str, Any]] = []
    for hit in points or []:
        score = float(hit.score or 0)
        if score < score_threshold:
            continue
        payload = hit.payload or {}
        results.append(
            {
                "id": str(hit.id),
                "score": score,
                "text": payload.get("text") or "",
                "section": payload.get("section") or "",
                "source": payload.get("source") or "",
                "audience": payload.get("audience") or "",
            }
        )
    return results


def format_citations(hits: list[dict[str, Any]]) -> str:
    if not hits:
        return ""
    blocks = []
    for i, h in enumerate(hits, 1):
        blocks.append(
            f"[{i}] 来源={h.get('source')} 章节={h.get('section')} 相似度={h.get('score'):.3f}\n{h.get('text')}"
        )
    return "\n\n".join(blocks)
