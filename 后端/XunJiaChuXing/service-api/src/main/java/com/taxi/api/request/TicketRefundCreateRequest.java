package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class TicketRefundCreateRequest {

    @NotNull(message = "工单ID不能为空")
    private Long ticketId;

    @NotNull(message = "退款金额不能为空")
    @DecimalMin(value = "0.01", message = "退款金额必须大于0")
    private BigDecimal refundAmount;

    private String reasonCode;

    private String reasonText;

    private String remark;

    private Integer operatorId;

    private String operatorName;

    /** 是否直接记为 APPROVED，默认 true（一期登记即同意） */
    private Boolean approveDirectly;
}
