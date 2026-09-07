package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 创建工单
 */
@Data
public class TicketCreateRequest {

    @NotBlank(message = "工单类型不能为空")
    private String category;

    private String title;

    @NotBlank(message = "工单内容不能为空")
    private String content;

    private Long orderId;

    /** 结构化申请 JSON 字符串，如 {"targetAddress":"370100"} */
    private String requestPayload;

    private Integer priority;
}
