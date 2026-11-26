package com.xunjia.order.rabbitMQ;

import com.xunjia.api.dto.OrderInfo;
import lombok.Data;

/**
 * 派单 MQ 消息：首轮可带 orderSnapshot；重试通常只带 orderId + retryCount。
 */
@Data
public class DispatchMessage {
    private Long orderId;
    /** 当前是第几次搜车（从 0 起）；满 MAX 次仍失败则置无效 */
    private int retryCount;
    private OrderInfo orderSnapshot;
}
