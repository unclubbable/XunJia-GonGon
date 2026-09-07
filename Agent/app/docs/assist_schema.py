"""协查图字段说明，health/控制台也用"""

from __future__ import annotations

import json
import sys
from typing import Any


def describe_assist_schema() -> dict[str, Any]:
    """返回协查图 schema"""
    return {
        "graph": "START -> load_ticket -> agent <-> tools -> finalize -> END",
        "messages_note": (
            "两类消息勿混："
            "ticket_messages=Java 工单聊天；"
            "messages=LLM 对话(System/Human/AI/Tool)，add_messages 追加。"
        ),
        "state": {
            "messages": "LLM 对话列表；reducer=add_messages，节点返回值追加而非覆盖",
            "thread_id": "LangGraph checkpoint 线程，对齐 Java agent_conversation",
            "ticket_id": "工单主键",
            "ticket": "请求预填的工单字段快照（非 Tool 拉取）",
            "ticket_messages": "工单内聊天记录（与 messages 不是一回事）",
            "operator_name": "运营人员显示名",
            "tool_steps": "agent<->tools 已完成轮数，用于 max_steps 熔断",
            "need_refund_advice": "是否必须评估退款建议",
            "need_execute_advice": "是否必须评估「通过并执行」",
            "has_order": "工单是否关联订单",
            "context_brief": "load_ticket 生成的案情 JSON 文本",
            "suggestion": "结构化处置建议（finalize 产出）",
            "summary": "摘要，与 suggestion.summary 同步",
            "error": "失败信息，空串表示正常",
            "policy_citations": "retrieve_policy 命中的协议片段",
        },
        "nodes": {
            "load_ticket": "预填 ticket/ticket_messages，写标记与初始 System+Human messages",
            "agent": "读 messages，bind_tools 决策；输出 AIMessage（可含 tool_calls）",
            "tools": "执行 tool_calls -> 追加 ToolMessage，tool_steps+1",
            "finalize": "根据对话与工具结果产出 suggestion/summary/policy_citations",
            "route_after_agent": "有 tool_calls 且未超限->tools，否则->finalize",
        },
        "tools_contract": (
            "全部只读；返回 JSON 字符串写入 ToolMessage；"
            "Java 工具直连微服务端口；retrieve_policy 走 Qdrant；"
            "不改 ticket/suggestion。"
        ),
    }


def describe_assist_tools(tools: list[Any] | None = None) -> list[dict[str, str]]:
    """从 Tool 对象提取 name/description，供 health 或文档复用。"""
    if tools is None:
        from app.tools.assist_tools import ASSIST_TOOLS

        tools = ASSIST_TOOLS
    rows: list[dict[str, str]] = []
    for t in tools:
        rows.append(
            {
                "name": getattr(t, "name", "") or "",
                "description": (getattr(t, "description", None) or "").strip(),
            }
        )
    return rows


def print_assist_schema(*, include_tools: bool = True, file=None) -> None:
    """把协查 State/节点/Tool 说明打印到控制台（默认 stdout）。"""
    out = file or sys.stdout
    payload: dict[str, Any] = dict(describe_assist_schema())
    if include_tools:
        payload["tools"] = describe_assist_tools()
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    _safe_print(text, title="Ticket Assist Schema", file=out)


def print_assist_progress(
    *,
    node: str,
    status: str = "enter",
    tools: list[str] | None = None,
    tool_steps: int | None = None,
    next_route: str | None = None,
    detail: str = "",
    ticket_id: int | None = None,
    thread_id: str | None = None,
    file=None,
) -> None:
    """打印 Agent 当前走到哪一步（节点 / 工具 / 轮次）。

    例：
      print_assist_progress(node="tools", status="run", tools=["get_order"], tool_steps=1)
    """
    out = file or sys.stdout
    parts = [f"[assist] node={node}", f"status={status}"]
    if tool_steps is not None:
        parts.append(f"tool_steps={tool_steps}")
    if tools:
        parts.append(f"tools={tools}")
    if next_route:
        parts.append(f"next={next_route}")
    if ticket_id is not None:
        parts.append(f"ticket_id={ticket_id}")
    if thread_id:
        parts.append(f"thread_id={thread_id}")
    if detail:
        parts.append(f"detail={detail}")
    line = " | ".join(parts)
    try:
        print(line, file=out, flush=True)
    except UnicodeEncodeError:
        enc = getattr(out, "encoding", None) or "utf-8"
        print(line.encode(enc, errors="replace").decode(enc, errors="replace"), file=out, flush=True)


def _safe_print(text: str, *, title: str, file=None) -> None:
    out = file or sys.stdout
    try:
        print(f"\n===== {title} =====", file=out)
        print(text, file=out)
        print(f"===== End {title} =====\n", file=out)
    except UnicodeEncodeError:
        enc = getattr(out, "encoding", None) or "utf-8"
        safe = text.encode(enc, errors="replace").decode(enc, errors="replace")
        print(f"\n===== {title} =====", file=out)
        print(safe, file=out)
        print(f"===== End {title} =====\n", file=out)
