package com.taxi.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 订单嵌套视图：主单 + 行程过程（管理端等场景使用）。
 * <p>
 * 乘客/司机原有扁平 {@link OrderInfo} 接口保持不变；本结构供 detail-nested 使用。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderNestedVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 订单主数据（不含行程时空过程字段，这些字段在 trip 中）。
     */
    private OrderInfo order;

    /**
     * 行程过程数据（预计起终点、接单/去接/上车/下车节点等）。
     */
    private OrderTrip trip;
}
