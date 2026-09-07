from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Any

from qdrant_client.http import models as qmodels

from app.config import ROOT_DIR, get_settings
from app.rag.embeddings import embed_texts
from app.rag.store import ensure_collection, get_qdrant_client

SECTION_RE = re.compile(r"(?m)^(#{1,3}\s+.+)$")


def _chunk_markdown(text: str, source: str, audience: str) -> list[dict[str, Any]]:
    parts = SECTION_RE.split(text)
    chunks: list[dict[str, Any]] = []
    if not parts:
        return chunks
    preamble = parts[0].strip()
    if preamble:
        chunks.append(
            {
                "text": preamble,
                "section": "前言",
                "source": source,
                "audience": audience,
            }
        )
    i = 1
    while i + 1 < len(parts):
        heading = parts[i].strip().lstrip("#").strip()
        body = parts[i + 1].strip()
        if body:
            chunks.append(
                {
                    "text": f"{heading}\n{body}",
                    "section": heading,
                    "source": source,
                    "audience": audience,
                }
            )
        i += 2
    return chunks


def load_knowledge_chunks(knowledge_dir: Path | None = None) -> list[dict[str, Any]]:
    base = knowledge_dir or (ROOT_DIR / "knowledge")
    files = [
        ("passenger_agreement.md", "passenger"),
        ("driver_agreement.md", "driver"),
    ]
    all_chunks: list[dict[str, Any]] = []
    for filename, audience in files:
        path = base / filename
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        all_chunks.extend(_chunk_markdown(text, source=filename, audience=audience))
    return all_chunks


def ingest_knowledge(recreate: bool = False) -> dict[str, Any]:
    settings = get_settings()
    chunks = load_knowledge_chunks()
    if not chunks:
        return {"ok": False, "message": "no knowledge chunks found", "count": 0}

    vectors = embed_texts([c["text"] for c in chunks], settings)
    dim = len(vectors[0])
    client = get_qdrant_client()
    name = settings.qdrant_collection
    if recreate:
        try:
            client.delete_collection(name)
        except Exception:
            pass
    ensure_collection(dim, settings)

    points = []
    for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
        key = f"{chunk['source']}:{chunk['section']}:{idx}"
        pid = str(uuid.uuid5(uuid.NAMESPACE_URL, key))
        points.append(
            qmodels.PointStruct(
                id=pid,
                vector=vector,
                payload={
                    "text": chunk["text"],
                    "section": chunk["section"],
                    "source": chunk["source"],
                    "audience": chunk["audience"],
                },
            )
        )
    client.upsert(collection_name=name, points=points)
    return {
        "ok": True,
        "collection": name,
        "count": len(points),
        "vector_size": dim,
        "sources": sorted({c["source"] for c in chunks}),
    }
