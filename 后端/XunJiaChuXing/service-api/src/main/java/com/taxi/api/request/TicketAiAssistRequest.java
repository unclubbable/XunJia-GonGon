package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class TicketAiAssistRequest {

    @NotNull(message = "工单ID不能为空")
    private Long ticketId;

    /** 运营用户ID（管理端暂无强鉴权时由前端传入） */
    private Long operatorId;

    private String operatorName;

    /** true=强制新开 thread，否则复用该工单下 ACTIVE 会话 */
    private Boolean newThread;
}
