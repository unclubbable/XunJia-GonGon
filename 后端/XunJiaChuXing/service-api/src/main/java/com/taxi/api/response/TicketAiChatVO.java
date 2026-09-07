package com.taxi.api.response;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TicketAiChatVO {

    private Long ticketId;
    private String threadId;
    private Long conversationId;
    private Integer phase;
    private Boolean refused;
    private String answer;
    private List<Map<String, Object>> citations;
    private String message;
}
