package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 驳回/取消退款登记
 */
@Data
public class TicketRefundRejectRequest {

    @NotNull(message = "退款单ID不能为空")
    private Long refundId;

    @NotBlank(message = "驳回原因不能为空")
    private String reason;

    private Integer operatorId;

    private String operatorName;
}
