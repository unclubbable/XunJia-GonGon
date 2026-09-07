package com.taxi.api.response;

import lombok.Data;

@Data
public class TicketAiAssistVO {

    private Long ticketId;
    private String threadId;
    private Long conversationId;

    /** 阶段标记：1=空跑，2+=真实协查 */
    private Integer phase;

    private String aiSummary;
    private String aiSuggestionJson;

    private Boolean echo;
    private String message;
}
