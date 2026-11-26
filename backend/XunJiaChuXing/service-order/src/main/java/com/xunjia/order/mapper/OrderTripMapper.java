package com.xunjia.order.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xunjia.api.dto.OrderTrip;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单行程过程表 Mapper
 */
@Mapper
public interface OrderTripMapper extends BaseMapper<OrderTrip> {
}
