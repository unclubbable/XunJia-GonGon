from __future__ import annotations

import sqlite3
from functools import lru_cache
from pathlib import Path

from langgraph.checkpoint.sqlite import SqliteSaver

from app.config import get_settings


def ensure_checkpoint_dir() -> Path:
    path = get_settings().checkpoint_path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def checkpoint_status() -> dict:
    path = ensure_checkpoint_dir()
    return {
        "backend": "sqlite",
        "path": str(path),
        "exists": path.exists(),
        "size_bytes": path.stat().st_size if path.exists() else 0,
    }


@lru_cache
def get_sqlite_saver() -> SqliteSaver:
    """Process-wide checkpointer (sync). Keep connection open for app lifetime."""
    path = ensure_checkpoint_dir()
    conn = sqlite3.connect(str(path), check_same_thread=False)
    return SqliteSaver(conn)
