package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class TicketMessageRequest {

    @NotNull(message = "工单ID不能为空")
    private Long ticketId;

    @NotBlank(message = "消息内容不能为空")
    private String content;

    /** 运营回复后是否等待用户：true -> PENDING_USER */
    private Boolean waitUser;

    private Integer assigneeId;

    private String assigneeName;

    /** HUMAN / AI_ASSISTED */
    private String contentSource;
}
