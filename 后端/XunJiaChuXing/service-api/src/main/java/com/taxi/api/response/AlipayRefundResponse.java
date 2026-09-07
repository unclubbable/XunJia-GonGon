package com.taxi.api.response;

import lombok.Data;

/**
 * 支付宝退款结果
 */
@Data
public class AlipayRefundResponse {
    private Boolean success;
    private String tradeNo;
    private String outRequestNo;
    private String refundFee;
    private String fundChange;
    private String message;
}
