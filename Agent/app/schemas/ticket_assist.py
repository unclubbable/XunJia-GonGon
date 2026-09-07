from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class RefundAdvice(BaseModel):
    suggest_refund: bool = False
    reason: str = Field(default="", description="建议退或不退的理由")
    amount_hint: str = Field(default="", description="建议金额描述，如“全额/部分约XX元”，禁止直接发起退款")
    evidence_needed: list[str] = Field(default_factory=list, description="退款前还需核实的材料")
    caution: str = Field(default="", description="风险提醒：仍须运营确认后走 Java 退款流程")


class ExecuteAdvice(BaseModel):
    """For CHANGE_CITY / CHANGE_PROFILE / BIND_VEHICLE."""
    suggest_approve: bool = False
    reason: str = Field(default="", description="建议通过或不通过的理由")
    checklist: list[str] = Field(default_factory=list, description="执行前核对项")
    caution: str = Field(default="", description="提醒：真正执行须点「通过并执行」，Agent 不直连改库")


class TicketAssistSuggestion(BaseModel):
    summary: str = Field(description="工单案情摘要，面向运营，200字内")
    risk_notes: list[str] = Field(default_factory=list, description="风险点/缺证据提示")
    recommended_actions: list[str] = Field(
        default_factory=list,
        description="建议动作：ACCEPT/REPLY/RESOLVE/REJECT/REFUND_CREATE/APPROVE_EXECUTE/NEED_MORE_INFO",
    )
    reply_draft: str = Field(default="", description="可直接发给用户的回复草稿")
    resolve_draft: str = Field(default="", description="结案说明草稿")
    reject_draft: str = Field(default="", description="驳回原因草稿，不建议驳回则空")
    refund_advice: RefundAdvice = Field(default_factory=RefundAdvice)
    execute_advice: ExecuteAdvice = Field(default_factory=ExecuteAdvice)
    confidence: Literal["high", "medium", "low"] = "medium"


class TicketAssistResult(BaseModel):
    phase: int = 4
    echo: bool = False
    thread_id: str
    ticket_id: int
    message: str = "assist ok"
    summary: str
    suggestion: dict[str, Any]
