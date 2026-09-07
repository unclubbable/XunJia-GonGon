package com.taxi.order.service;

import com.taxi.api.dto.OrderInfo;
import com.taxi.api.dto.OrderNestedVO;
import com.taxi.api.dto.OrderTrip;
import com.taxi.api.util.OrderTripAssembler;
import com.taxi.order.mapper.OrderTripMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/** order_trip 读写，给 OrderInfo 补行程字段 */
@Slf4j
@Service
public class OrderTripService {

    @Autowired
    private OrderTripMapper orderTripMapper;

    /** 下单写 trip，事务由外层保证 */
    public void insertFromOrder(OrderInfo orderInfo) {
        OrderTrip trip = OrderTripAssembler.fromOrderInfo(orderInfo);
        if (trip == null) {
            log.warn("跳过行程插入：orderInfo 或 id 为空");
            return;
        }
        orderTripMapper.insert(trip);
    }

    /** 全量更新 trip；没有行就补插 */
    public void saveFromOrder(OrderInfo orderInfo) {
        if (orderInfo == null || orderInfo.getId() == null) {
            return;
        }
        OrderTrip trip = OrderTripAssembler.fromOrderInfo(orderInfo);
        OrderTrip existing = orderTripMapper.selectById(orderInfo.getId());
        if (existing == null) {
            log.warn("订单 {} 缺少 order_trip 记录，自动补插", orderInfo.getId());
            orderTripMapper.insert(trip);
        } else {
            orderTripMapper.updateById(trip);
        }
    }

    public OrderTrip getByOrderId(Long orderId) {
        if (orderId == null) {
            return null;
        }
        return orderTripMapper.selectById(orderId);
    }

    /** 查 trip 填回 OrderInfo */
    public OrderInfo mergeTrip(OrderInfo orderInfo) {
        if (orderInfo == null || orderInfo.getId() == null) {
            return orderInfo;
        }
        OrderTrip trip = orderTripMapper.selectById(orderInfo.getId());
        if (trip != null) {
            OrderTripAssembler.mergeTripIntoOrder(orderInfo, trip);
        } else {
            log.warn("订单 {} 无 order_trip，扁平字段可能为空", orderInfo.getId());
        }
        return orderInfo;
    }

    /** 批量补 trip，避免列表 N+1 */
    public void mergeTripBatch(List<OrderInfo> orderInfoList) {
        if (CollectionUtils.isEmpty(orderInfoList)) {
            return;
        }
        List<Long> ids = orderInfoList.stream()
                .filter(Objects::nonNull)
                .map(OrderInfo::getId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (ids.isEmpty()) {
            return;
        }
        List<OrderTrip> trips = orderTripMapper.selectBatchIds(ids);
        Map<Long, OrderTrip> tripMap = new HashMap<>();
        if (trips != null) {
            for (OrderTrip trip : trips) {
                tripMap.put(trip.getOrderId(), trip);
            }
        }
        for (OrderInfo orderInfo : orderInfoList) {
            if (orderInfo == null || orderInfo.getId() == null) {
                continue;
            }
            OrderTrip trip = tripMap.get(orderInfo.getId());
            if (trip != null) {
                OrderTripAssembler.mergeTripIntoOrder(orderInfo, trip);
            }
        }
    }

    /** 嵌套返回 order + trip */
    public OrderNestedVO toNested(OrderInfo orderInfo) {
        if (orderInfo == null) {
            return null;
        }
        OrderTrip trip = getByOrderId(orderInfo.getId());
        // 库里没有就从 OrderInfo 字段拼
        if (trip == null) {
            trip = OrderTripAssembler.fromOrderInfo(orderInfo);
        }
        return OrderTripAssembler.toNested(orderInfo, trip);
    }
}
