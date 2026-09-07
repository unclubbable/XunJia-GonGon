package com.taxi.order.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.taxi.api.dto.OrderDetailInfo;
import com.taxi.api.dto.OrderInfo;
import com.taxi.api.dto.OrderNestedVO;
import com.taxi.api.request.OrderRequest;
import com.taxi.api.response.OrderTrackVO;
import com.taxi.api.result.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.ArrayList;


public interface IOrderInfoService extends IService<OrderInfo> {

    Result add(OrderRequest orderRequest);

    Result<OrderInfo> toPickUpPassenger(OrderRequest orderRequest);

    Result<OrderInfo> arrivedDeparture(OrderRequest orderRequest);

    Result<OrderInfo> pickUpPassenger(OrderRequest orderRequest);

    Result<OrderInfo> passengerGetOff(OrderRequest orderRequest);

    Result pay(OrderRequest orderRequest);

    Result cancel(Long orderId);

    Result pushPayInfo(Long orderId, String price,Long passengerId);

    Result<OrderInfo> current(String phone, String identity);

    Result<OrderDetailInfo> currentOrderDetail(Long orderId);

    Result<ArrayList<OrderInfo>> getAllOrders(String phone, String identity);

    Result<OrderInfo> detail(Long orderId);

    /**
     * 嵌套详情 {order, trip}，管理端使用
     */
    Result<OrderNestedVO> detailNested(Long orderId);

    /**
     * 乘客/司机查看本单行程轨迹（按 orderId，不暴露 tid）
     */
    Result<OrderTrackVO> orderTrack(Long orderId);

    Result getAllOrderList(int page,int limit,String address,String phone);

    Result updateOrder(OrderInfo orderInfo);

}
