"""直连 Java 微服务（绕过网关 JWT），供 assist_tools 用。
成功 {ok, code, message, data}；失败 ok=False。
"""

from __future__ import annotations

import json
from typing import Any
from urllib.parse import quote

import httpx

from app.config import get_settings

# service-order UserContext expects this header (URL-decoded JSON TokenResult)
_ADMIN_TOKEN_RESULT = quote(
    json.dumps({"phone": "ai-agent", "identity": "3"}, ensure_ascii=False),
    safe="",
)


def java_result_ok(payload: Any) -> bool:
    if not isinstance(payload, dict):
        return False
    return payload.get("code") == 1


def java_get(
    base_url: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    as_admin: bool = False,
    timeout: float | None = None,
) -> dict[str, Any]:
    """GET `{base}{path}` and return parsed JSON (or error envelope)."""
    settings = get_settings()
    if not settings.java_tools_enabled:
        return {
            "ok": False,
            "error": "java_tools_disabled",
            "message": "JAVA_TOOLS_ENABLED=false；工具未实际调用下游",
        }

    base = (base_url or "").rstrip("/")
    if not base:
        return {"ok": False, "error": "missing_base_url", "message": "服务 base_url 未配置"}

    url = f"{base}{path if path.startswith('/') else '/' + path}"
    headers: dict[str, str] = {"Accept": "application/json"}
    token = (settings.java_internal_token or "").strip()
    if token:
        headers["X-AI-Internal-Token"] = token
    if as_admin:
        headers["tokenResult"] = _ADMIN_TOKEN_RESULT

    try:
        with httpx.Client(timeout=timeout or settings.java_http_timeout) as client:
            resp = client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        return {
            "ok": False,
            "error": "http_status",
            "status_code": exc.response.status_code,
            "message": exc.response.text[:500],
            "url": url,
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "ok": False,
            "error": "request_failed",
            "message": str(exc)[:500],
            "url": url,
        }

    if isinstance(data, dict) and "code" in data:
        return {
            "ok": java_result_ok(data),
            "code": data.get("code"),
            "message": data.get("message"),
            "data": data.get("data"),
            "url": url,
        }
    return {"ok": True, "data": data, "url": url}
