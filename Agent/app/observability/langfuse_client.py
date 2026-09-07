from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

from app.config import Settings, get_settings

_langfuse = None
_init_attempted = False


def get_langfuse(settings: Settings | None = None):
    """Lazy Langfuse client; returns None when disabled or keys missing."""
    global _langfuse, _init_attempted
    s = settings or get_settings()
    if not s.langfuse_ready:
        return None
    if _langfuse is not None:
        return _langfuse
    if _init_attempted and _langfuse is None:
        return None
    _init_attempted = True
    try:
        from langfuse import Langfuse

        _langfuse = Langfuse(
            public_key=s.langfuse_public_key,
            secret_key=s.langfuse_secret_key,
            host=s.langfuse_host,
        )
        return _langfuse
    except Exception:
        _langfuse = None
        return None


@contextmanager
def trace_span(
    name: str,
    metadata: dict[str, Any] | None = None,
    *,
    input: Any = None,
) -> Iterator[Any]:
    """No-op when Langfuse is not configured. Compatible with langfuse v3/v4."""
    client = get_langfuse()
    if client is None:
        yield None
        return

    # Langfuse SDK v4
    if hasattr(client, "start_as_current_observation"):
        with client.start_as_current_observation(
            as_type="span",
            name=name,
            metadata=metadata or {},
            input=input,
        ) as span:
            try:
                yield span
            finally:
                try:
                    client.flush()
                except Exception:
                    pass
        return

    # Legacy fallback (v2)
    trace = client.trace(name=name, metadata=metadata or {}, input=input)
    span = trace.span(name=name)
    try:
        yield span
        span.end()
    except Exception as exc:
        span.end(level="ERROR", status_message=str(exc))
        raise
    finally:
        try:
            client.flush()
        except Exception:
            pass


def update_observation(span: Any, *, output: Any = None, metadata: dict[str, Any] | None = None) -> None:
    if span is None:
        return
    try:
        if hasattr(span, "update"):
            kwargs: dict[str, Any] = {}
            if output is not None:
                kwargs["output"] = output
            if metadata:
                kwargs["metadata"] = metadata
            if kwargs:
                span.update(**kwargs)
    except Exception:
        pass
