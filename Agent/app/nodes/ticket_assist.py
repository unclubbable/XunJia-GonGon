"""协查节点：load → agent ↔ tools → finalize"""

from __future__ import annotations

import json
from typing import Annotated, Any, Literal, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.graph.message import add_messages

from app.config import get_settings
from app.docs import print_assist_progress
from app.llm.siliconflow import build_chat_model
from app.schemas.ticket_assist import ExecuteAdvice, RefundAdvice, TicketAssistSuggestion
from app.tools.assist_tools import ASSIST_TOOLS

EXECUTABLE = {"CHANGE_CITY", "CHANGE_PROFILE", "BIND_VEHICLE"}
REFUND_HINT_CATEGORIES = {
    "DETOUR",
    "OVERCHARGE",
    "CANCEL_DISPUTE",
    "UNPAID_DISPUTE",
    "ORDER_ISSUE",
    "ATTITUDE",
    "OTHER",
}


class TicketAssistState(TypedDict, total=False):
    """协查 State"""

    messages: Annotated[list[AnyMessage], add_messages]
    thread_id: str
    ticket_id: int
    ticket: dict[str, Any]
    ticket_messages: list[Any]
    operator_name: str
    tool_steps: int
    need_refund_advice: bool
    need_execute_advice: bool
    has_order: bool
    context_brief: str
    suggestion: dict[str, Any]
    summary: str
    error: str
    policy_citations: list[dict[str, Any]]


def _fmt_messages(messages: list[Any], limit: int = 20) -> str:
    lines: list[str] = []
    for msg in (messages or [])[-limit:]:
        if isinstance(msg, dict):
            sender = msg.get("senderName") or msg.get("sender_name") or msg.get("senderType") or "?"
            content = msg.get("content") or ""
            lines.append(f"- [{sender}] {content}")
        else:
            lines.append(f"- {msg}")
    return "\n".join(lines) if lines else "(无消息)"


def _ticket_flags(ticket: dict[str, Any]) -> dict[str, Any]:
    category = (ticket.get("category") or "").upper()
    has_order = bool(ticket.get("orderId") or ticket.get("order_id"))
    executable = category in EXECUTABLE
    return {
        "category": category,
        "has_order": has_order,
        "executable_category": executable,
        "need_refund_advice": has_order and category in REFUND_HINT_CATEGORIES,
        "need_execute_advice": executable,
    }


AGENT_SYSTEM = """你是「讯家出行」管理端工单协查助手。
你只能协助运营决策：不退款、不改库、不承诺到账、不自动「通过并执行」。

工作方式：
1. 工单正文与聊天记录已在用户消息中给出，无需再查工单本身。
2. 若信息不足，按需调用只读工具（订单、计价、钱包、轨迹、车辆、支付推断、退款单、协议检索等）。
3. 涉及平台规则/准则时优先调用 retrieve_policy，只能依据返回片段引用条款。
4. 工具够用后，用自然语言给出完整处置结论（摘要、建议动作、回复草稿、退款/执行建议、风险与信心）。
5. 不要编造未返回的工具数据；查不到就写明缺什么。
6. 当 need_refund_advice=true 必须讨论退款建议；need_execute_advice=true 必须讨论是否建议通过执行。
"""


FINALIZE_SYSTEM = """你是「讯家出行」管理端工单助手，只协助运营决策，不直接改数据、不承诺退款到账、不自动「通过并执行」。
根据工单上下文与工具调用结果，输出必须符合给定 JSON 结构。

通用规则：
1. summary：客观概括诉求、关联订单、当前状态、证据是否充分。
2. recommended_actions：从 ACCEPT/REPLY/RESOLVE/REJECT/REFUND_CREATE/APPROVE_EXECUTE/NEED_MORE_INFO 中选，可多选。
3. reply_draft：对用户话术，礼貌、可直接发送；不确定时引导补充材料。
4. resolve_draft / reject_draft：仅在有依据时填写，否则空字符串。
5. 证据不足时 confidence=low，并在 risk_notes 写明缺什么。
6. 只能依据对话中已出现的工具结果与工单字段，禁止编造。

退款建议（仅当 need_refund_advice=true）：
- 必须输出 refund_advice；无证据倾向 suggest_refund=false。
- amount_hint 只给区间或「待核对后填写」。
- caution 必须提醒须运营确认后走 Java 退款流程。

执行建议（仅当 need_execute_advice=true）：
- 必须输出 execute_advice；缺关键字段则 suggest_approve=false。
- caution 必须提醒须运营点击「通过并执行」。

当 need_refund_advice=false：refund_advice.suggest_refund=false。
当 need_execute_advice=false：execute_advice.suggest_approve=false。
"""


def _pending_tool_names(state: TicketAssistState) -> list[str]:
    msgs = state.get("messages") or []
    last = msgs[-1] if msgs else None
    if not isinstance(last, AIMessage):
        return []
    names: list[str] = []
    for call in getattr(last, "tool_calls", None) or []:
        if isinstance(call, dict):
            name = call.get("name") or ""
        else:
            name = getattr(call, "name", "") or ""
        if name:
            names.append(str(name))
    return names


def load_ticket(state: TicketAssistState) -> dict[str, Any]:
    """预填工单，初始化 messages"""
    print_assist_progress(
        node="load_ticket",
        status="enter",
        ticket_id=state.get("ticket_id"),
        thread_id=state.get("thread_id"),
    )
    ticket = state.get("ticket") or {}
    ticket_messages = state.get("ticket_messages") or []
    flags = _ticket_flags(ticket)
    order_id = ticket.get("orderId") or ticket.get("order_id")
    driver_id = ticket.get("driverId") or ticket.get("driver_id")
    driver_phone = ticket.get("driverPhone") or ticket.get("driver_phone")
    passenger_phone = ticket.get("passengerPhone") or ticket.get("passenger_phone")

    brief = {
        "ticket_id": state.get("ticket_id") or ticket.get("id"),
        "ticket_no": ticket.get("ticketNo") or ticket.get("ticket_no"),
        "source": ticket.get("source"),
        "category": flags["category"],
        "status": ticket.get("status"),
        "title": ticket.get("title"),
        "content": ticket.get("content"),
        "order_id": order_id,
        "driver_id": driver_id,
        "passenger_phone": passenger_phone,
        "driver_phone": driver_phone,
        "request_payload": ticket.get("requestPayload") or ticket.get("request_payload"),
        "assignee_name": ticket.get("assigneeName") or ticket.get("assignee_name"),
        "has_order": flags["has_order"],
        "need_refund_advice": flags["need_refund_advice"],
        "need_execute_advice": flags["need_execute_advice"],
        "recent_messages": _fmt_messages(ticket_messages),
        "tool_hints": {
            "get_order": "有 order_id 时查订单",
            "get_price_rule": "多收费时查城市+车型计价",
            "get_trip_track": "绕路时查轨迹",
            "get_driver_wallet / get_driver_orders": "工资/资金异常",
            "get_vehicle / list_bindable_cars": "换绑车辆",
            "check_city_price_support": "改城市",
            "get_payment / get_refund": "支付与退款核对",
            "retrieve_policy": "协议/准则条款检索（audience=passenger|driver）",
        },
    }
    text = json.dumps(brief, ensure_ascii=False, indent=2)
    human = (
        f"运营人员：{state.get('operator_name') or 'admin'}\n"
        f"请协查以下工单。可按需调用工具，完成后给出处置结论。\n"
        f"{text}"
    )
    print_assist_progress(
        node="load_ticket",
        status="done",
        detail=f"category={flags['category']} has_order={flags['has_order']}",
        ticket_id=state.get("ticket_id"),
        next_route="agent",
    )
    return {
        "ticket": ticket,
        "ticket_messages": ticket_messages,
        "has_order": flags["has_order"],
        "need_refund_advice": flags["need_refund_advice"],
        "need_execute_advice": flags["need_execute_advice"],
        "context_brief": text,
        "tool_steps": 0,
        "policy_citations": [],
        "messages": [SystemMessage(content=AGENT_SYSTEM), HumanMessage(content=human)],
    }


def agent_node(state: TicketAssistState) -> dict[str, Any]:
    """调 LLM+tools"""
    steps = int(state.get("tool_steps") or 0)
    print_assist_progress(
        node="agent",
        status="enter",
        tool_steps=steps,
        ticket_id=state.get("ticket_id"),
        thread_id=state.get("thread_id"),
    )
    llm = build_chat_model(temperature=0).bind_tools(ASSIST_TOOLS)
    ai = llm.invoke(state.get("messages") or [])
    tool_names: list[str] = []
    for call in getattr(ai, "tool_calls", None) or []:
        if isinstance(call, dict):
            name = call.get("name") or ""
        else:
            name = getattr(call, "name", "") or ""
        if name:
            tool_names.append(str(name))
    print_assist_progress(
        node="agent",
        status="done",
        tool_steps=steps,
        tools=tool_names or None,
        detail="will_call_tools" if tool_names else "no_tool_calls",
        ticket_id=state.get("ticket_id"),
    )
    return {"messages": [ai]}


def route_after_agent(state: TicketAssistState) -> Literal["tools", "finalize"]:
    """有 tool 且未超限 → tools，否则 finalize"""
    max_steps = get_settings().assist_max_tool_steps
    steps = int(state.get("tool_steps") or 0)
    msgs = state.get("messages") or []
    last = msgs[-1] if msgs else None
    has_tools = isinstance(last, AIMessage) and bool(getattr(last, "tool_calls", None))
    pending = _pending_tool_names(state)
    if has_tools and steps < max_steps:
        print_assist_progress(
            node="route_after_agent",
            status="route",
            tools=pending or None,
            tool_steps=steps,
            next_route="tools",
            ticket_id=state.get("ticket_id"),
        )
        return "tools"
    reason = "max_steps" if has_tools and steps >= max_steps else "no_tool_calls"
    print_assist_progress(
        node="route_after_agent",
        status="route",
        tools=pending or None,
        tool_steps=steps,
        next_route="finalize",
        detail=reason,
        ticket_id=state.get("ticket_id"),
    )
    return "finalize"


def bump_tool_steps(state: TicketAssistState) -> dict[str, Any]:
    """tools 完 steps++"""
    return {"tool_steps": int(state.get("tool_steps") or 0) + 1}


def _normalize_suggestion(ticket: dict[str, Any], suggestion: TicketAssistSuggestion) -> TicketAssistSuggestion:
    category = (ticket.get("category") or "").upper()
    has_order = bool(ticket.get("orderId") or ticket.get("order_id"))
    executable = category in EXECUTABLE

    if not has_order:
        suggestion.refund_advice = RefundAdvice(
            suggest_refund=False,
            reason="无关联订单，不评估退款",
            caution="无 orderId 不可发起退款流程",
        )
        suggestion.recommended_actions = [
            a for a in suggestion.recommended_actions if a != "REFUND_CREATE"
        ]

    if not executable:
        suggestion.execute_advice = ExecuteAdvice(
            suggest_approve=False,
            reason="非司机可执行变更类工单，不评估通过并执行",
            caution="仅 CHANGE_CITY / CHANGE_PROFILE / BIND_VEHICLE 可执行",
        )
        suggestion.recommended_actions = [
            a for a in suggestion.recommended_actions if a != "APPROVE_EXECUTE"
        ]
    else:
        if not suggestion.execute_advice.caution:
            suggestion.execute_advice.caution = "须运营点击「通过并执行」；Agent 不直连改库"

    if has_order and not suggestion.refund_advice.caution:
        suggestion.refund_advice.caution = "须运营确认后走 Java 退款登记/执行；Agent 不得退款"

    seen: set[str] = set()
    actions: list[str] = []
    for a in suggestion.recommended_actions:
        if a and a not in seen:
            seen.add(a)
            actions.append(a)
    suggestion.recommended_actions = actions
    return suggestion


def _collect_policy_citations(messages: list[AnyMessage]) -> list[dict[str, Any]]:
    """从 policy tool 拿引用"""
    out: list[dict[str, Any]] = []
    for msg in messages or []:
        if not isinstance(msg, ToolMessage):
            continue
        name = getattr(msg, "name", "") or ""
        if name != "retrieve_policy":
            continue
        try:
            payload = json.loads(msg.content or "{}")
        except Exception:  # noqa: BLE001
            continue
        cites = payload.get("citations") or []
        if isinstance(cites, list):
            out.extend([c for c in cites if isinstance(c, dict)])
    return out


def finalize_node(state: TicketAssistState) -> dict[str, Any]:
    """输出 suggestion JSON"""
    print_assist_progress(
        node="finalize",
        status="enter",
        tool_steps=int(state.get("tool_steps") or 0),
        ticket_id=state.get("ticket_id"),
        thread_id=state.get("thread_id"),
    )
    flags = {
        "need_refund_advice": bool(state.get("need_refund_advice")),
        "need_execute_advice": bool(state.get("need_execute_advice")),
        "has_order": bool(state.get("has_order")),
        "tool_steps": int(state.get("tool_steps") or 0),
        "max_tool_steps": get_settings().assist_max_tool_steps,
    }
    msgs = state.get("messages") or []
    transcript_parts: list[str] = []
    for msg in msgs:
        role = getattr(msg, "type", msg.__class__.__name__)
        content = getattr(msg, "content", "") or ""
        if isinstance(content, list):
            content = json.dumps(content, ensure_ascii=False, default=str)
        tool_calls = getattr(msg, "tool_calls", None)
        if tool_calls:
            transcript_parts.append(f"[{role}] tool_calls={json.dumps(tool_calls, ensure_ascii=False, default=str)}")
        if content:
            transcript_parts.append(f"[{role}] {content}")

    user_prompt = (
        f"标志位：{json.dumps(flags, ensure_ascii=False)}\n"
        f"工单摘要 JSON：\n{state.get('context_brief') or '{}'}\n\n"
        f"对话与工具结果：\n" + "\n".join(transcript_parts[-40:])
    )

    llm = build_chat_model(temperature=0)
    structured = llm.with_structured_output(TicketAssistSuggestion)
    try:
        result = structured.invoke(
            [
                SystemMessage(content=FINALIZE_SYSTEM),
                HumanMessage(content=user_prompt),
            ]
        )
        if isinstance(result, TicketAssistSuggestion):
            suggestion = result
        else:
            suggestion = TicketAssistSuggestion.model_validate(result)
    except Exception as first_err:
        try:
            raw = llm.invoke(
                [
                    SystemMessage(
                        content=FINALIZE_SYSTEM
                        + "\n只输出一个 JSON 对象，字段："
                        + "summary,risk_notes,recommended_actions,reply_draft,resolve_draft,"
                        + "reject_draft,refund_advice,execute_advice,confidence"
                    ),
                    HumanMessage(content=user_prompt),
                ]
            )
            content = getattr(raw, "content", "") or ""
            start = content.find("{")
            end = content.rfind("}")
            if start < 0 or end < 0:
                raise ValueError(f"no json in model output: {content[:200]}")
            suggestion = TicketAssistSuggestion.model_validate_json(content[start : end + 1])
        except Exception as second_err:
            print_assist_progress(
                node="finalize",
                status="error",
                tool_steps=flags["tool_steps"],
                detail=str(second_err)[:120],
                ticket_id=state.get("ticket_id"),
                next_route="END",
            )
            return {
                "error": f"llm_failed: {first_err}; fallback: {second_err}",
                "summary": "AI 协查失败，请稍后重试或人工处理。",
                "suggestion": TicketAssistSuggestion(
                    summary="AI 协查失败",
                    risk_notes=[str(second_err)[:200]],
                    recommended_actions=["NEED_MORE_INFO"],
                    confidence="low",
                ).model_dump(),
                "policy_citations": _collect_policy_citations(msgs),
            }

    if flags["tool_steps"] >= flags["max_tool_steps"]:
        notes = list(suggestion.risk_notes or [])
        notes.append("工具调用达上限，可能未查全证据")
        suggestion.risk_notes = notes
        if suggestion.confidence == "high":
            suggestion.confidence = "medium"

    suggestion = _normalize_suggestion(state.get("ticket") or {}, suggestion)
    print_assist_progress(
        node="finalize",
        status="done",
        tool_steps=flags["tool_steps"],
        detail=f"confidence={suggestion.confidence} actions={suggestion.recommended_actions}",
        ticket_id=state.get("ticket_id"),
        next_route="END",
    )
    return {
        "summary": suggestion.summary,
        "suggestion": suggestion.model_dump(),
        "error": "",
        "policy_citations": _collect_policy_citations(msgs),
    }


# Backward-compatible aliases (old graph / imports)
def build_context(state: TicketAssistState) -> dict[str, Any]:
    return load_ticket(state)


def run_llm_assist(state: TicketAssistState) -> dict[str, Any]:
    return finalize_node(state)
