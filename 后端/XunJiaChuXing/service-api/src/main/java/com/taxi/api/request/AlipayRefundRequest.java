package com.taxi.api.request;

import lombok.Data;

/**
 * 支付宝退款请求（内部 Feign）
 */
@Data
public class AlipayRefundRequest {
    /** 支付宝交易号 trade_no（订单 payOrderId） */
    private String tradeNo;
    /** 商户退款请求号（退款单号，保证幂等） */
    private String outRequestNo;
    /** 退款金额，元，两位小数 */
    private String refundAmount;
    /** 退款原因 */
    private String refundReason;
}
