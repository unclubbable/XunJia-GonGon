package com.xunjia.api.dto.ws;

import lombok.Data;

/**
 * 工单实时通知 payload（TICKET_MESSAGE / TICKET_STATUS / TICKET_CREATED）。
 */
@Data
public class TicketWsPayload {

    private Long ticketId;

    /** 有聊天消息时必填，供前端去重 */
    private Long messageId;

    /** 1乘客 2司机 3运营 4系统 */
    private Integer senderType;

    private String senderName;

    private String content;

    /** 1文本 2系统事件 */
    private Integer msgType;

    /** 工单当前状态快照，状态变更时必填 */
    private String status;

    private String ticketNo;

    /** 工单标题（创建通知用） */
    private String title;

    /** 工单类型 */
    private String category;

    /** 1乘客 2司机 */
    private Integer source;
}
