package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class TicketAiChatRequest {

    /** 可选：关联工单；为空则纯协议问答会话 */
    private Long ticketId;

    @NotBlank(message = "问题不能为空")
    private String question;

    private Long operatorId;
    private String operatorName;

    /** passenger / driver；空则两端一起检索 */
    private String audience;

    /** true=新开 thread */
    private Boolean newThread;

    /** 前端可带回最近几轮；服务端也会用 thread 续聊 */
    private java.util.List<java.util.Map<String, String>> history;
}
