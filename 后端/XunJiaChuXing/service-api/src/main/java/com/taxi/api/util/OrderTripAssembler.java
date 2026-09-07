package com.taxi.api.util;

import com.taxi.api.dto.OrderInfo;
import com.taxi.api.dto.OrderNestedVO;
import com.taxi.api.dto.OrderTrip;
import org.springframework.beans.BeanUtils;

/** OrderInfo ↔ OrderTrip；老接口扁平，新接口嵌套 */
public final class OrderTripAssembler {

    private OrderTripAssembler() {
    }

    /** OrderInfo → 待插入的 trip */
    public static OrderTrip fromOrderInfo(OrderInfo orderInfo) {
        if (orderInfo == null || orderInfo.getId() == null) {
            return null;
        }
        OrderTrip trip = new OrderTrip();
        BeanUtils.copyProperties(orderInfo, trip);
        trip.setOrderId(orderInfo.getId());
        return trip;
    }

    /** trip 字段覆盖进 OrderInfo */
    public static void mergeTripIntoOrder(OrderInfo orderInfo, OrderTrip trip) {
        if (orderInfo == null || trip == null) {
            return;
        }
        // orderId 不会盖掉 id
        BeanUtils.copyProperties(trip, orderInfo);
    }

    /** 嵌套 VO，order 侧清掉行程字段 */
    public static OrderNestedVO toNested(OrderInfo flatOrder, OrderTrip trip) {
        OrderInfo orderPart = new OrderInfo();
        if (flatOrder != null) {
            BeanUtils.copyProperties(flatOrder, orderPart);
            clearTripFields(orderPart);
        }
        return new OrderNestedVO(orderPart, trip);
    }

    /** 清掉已迁到 order_trip 的字段 */
    public static void clearTripFields(OrderInfo orderInfo) {
        if (orderInfo == null) {
            return;
        }
        orderInfo.setDepartTime(null);
        orderInfo.setDeparture(null);
        orderInfo.setDepLongitude(null);
        orderInfo.setDepLatitude(null);
        orderInfo.setDestination(null);
        orderInfo.setDestLongitude(null);
        orderInfo.setDestLatitude(null);
        orderInfo.setReceiveOrderCarLongitude(null);
        orderInfo.setReceiveOrderCarLatitude(null);
        orderInfo.setReceiveOrderTime(null);
        orderInfo.setToPickUpPassengerTime(null);
        orderInfo.setToPickUpPassengerLongitude(null);
        orderInfo.setToPickUpPassengerLatitude(null);
        orderInfo.setToPickUpPassengerAddress(null);
        orderInfo.setDriverArrivedDepartureTime(null);
        orderInfo.setPickUpPassengerTime(null);
        orderInfo.setPickUpPassengerLongitude(null);
        orderInfo.setPickUpPassengerLatitude(null);
        orderInfo.setPassengerGetoffTime(null);
        orderInfo.setPassengerGetoffLongitude(null);
        orderInfo.setPassengerGetoffLatitude(null);
    }
}
