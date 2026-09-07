package com.taxi.api.request;

import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * 执行退款（手动确认 / 支付宝）
 */
@Data
public class TicketRefundExecuteRequest {

    @NotNull(message = "退款单ID不能为空")
    private Long refundId;

    /**
     * MANUAL / ALIPAY
     */
    @NotNull(message = "退款渠道不能为空")
    private String channel;

    /** 手动退款凭证号（MANUAL 建议填写） */
    private String voucherNo;

    private String remark;

    private Integer operatorId;

    private String operatorName;
}
