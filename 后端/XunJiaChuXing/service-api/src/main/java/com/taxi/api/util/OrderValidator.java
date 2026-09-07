package com.taxi.api.util;

import com.taxi.api.dto.OrderInfo;
import com.taxi.api.exception.BusinessException;
import com.taxi.api.result.ResultCodeEnum;

/**
 * 订单存在性与状态流转校验
 */
public final class OrderValidator {

    private OrderValidator() {}

    public static OrderInfo requireOrder(OrderInfo orderInfo) {
        if (orderInfo == null) {
            throw new BusinessException(ResultCodeEnum.ORDER_NOT_EXISTS);
        }
        return orderInfo;
    }

    public static void requireStatus(OrderInfo orderInfo, int... allowedStatuses) {
        requireOrder(orderInfo);
        int current = orderInfo.getOrderStatus();
        for (int allowed : allowedStatuses) {
            if (current == allowed) {
                return;
            }
        }
        throw new BusinessException(ResultCodeEnum.ORDER_STATUS_ERROR,
                "订单状态不正确，无法执行此操作（当前状态：" + current + "）");
    }
}
