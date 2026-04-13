package com.taxi.order.controller;


import com.taxi.api.dto.OrderDetailInfo;
import com.taxi.api.dto.OrderInfo;
import com.taxi.api.request.OrderRequest;
import com.taxi.api.result.Result;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.order.service.IOrderInfoService;
import com.taxi.common.util.UserContext;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;


@Slf4j
@RestController
@RequestMapping("/order")
public class OrderInfoController {

    @Autowired
    private IOrderInfoService orderInfoService;

    @ApiOperation("/创建订单/下单")
    @PostMapping("/add")
    public Result add(@RequestBody OrderRequest orderRequest){
        return orderInfoService.add(orderRequest);
    }

    @ApiOperation("订单详情")
    @GetMapping("/detail")
    public Result<OrderInfo> detail(Long orderId){
        return orderInfoService.detail(orderId);
    }

    @ApiOperation("去接乘客并通知")
    @PostMapping("/to-pick-up-passenger")
    public Result toPickUpPassenger(@RequestBody OrderRequest orderRequest){
        return orderInfoService.toPickUpPassenger(orderRequest);
    }

    @ApiOperation("到达乘客出发地,并通知")
    @PostMapping("/arrived-departure")
    public Result<OrderInfo> arrivedDeparture(@RequestBody OrderRequest orderRequest){
        return orderInfoService.arrivedDeparture(orderRequest);
    }

    @ApiOperation("乘客上车司机开始行程,通知前端")
    @PostMapping("/pick-up-passenger")
    public Result<OrderInfo> pickUpPassenger(@RequestBody OrderRequest orderRequest){
        return orderInfoService.pickUpPassenger(orderRequest);
    }

    @ApiOperation("乘客到达目的地,行程终止")
    @PostMapping("/passenger-getoff")
    public Result<OrderInfo> passengerGetOff(@RequestBody OrderRequest orderRequest){
        return orderInfoService.passengerGetOff(orderRequest);
    }

    @ApiOperation("司机发起收款")
    @PostMapping("/push-pay-info")
    public Result pushPayInfo(@RequestParam Long orderId,@RequestParam String price,@RequestParam Long passengerId){
        return orderInfoService.pushPayInfo(orderId,price,passengerId);
    }

    @ApiOperation("支付完成")
    @PostMapping("/pay")
    public Result pay(@RequestBody OrderRequest orderRequest){
        return orderInfoService.pay(orderRequest);
    }

    @ApiOperation("司机端或客户端订单取消")
    @PostMapping("/cancel")
    public Result cancelDriver(@RequestParam Long orderId){
        return orderInfoService.cancel(orderId);
    }

    @ApiOperation("判断当前用户有无正在进行中的订单")
    @GetMapping("/current")
    public Result<OrderInfo> current(){
        return orderInfoService.current(UserContext.getUser().getPhone(), UserContext.getUser().getIdentity());
    }

    @ApiOperation("根据订单id获取正在行程中的订单详情")
    @GetMapping("/current-order-detail")
    public Result<OrderDetailInfo> currentOrderDetail(@RequestParam Long orderId){
        return orderInfoService.currentOrderDetail(orderId);
    }

    @ApiOperation("用户端使用--获取用户所有订单")
    @GetMapping("/get-all-orders")
    public Result<ArrayList<OrderInfo>> getAllOrders(){
        return orderInfoService.getAllOrders(UserContext.getUser().getPhone(), UserContext.getUser().getIdentity());
    }


    @ApiOperation("获取订单列表")
    @GetMapping("/get-order-list")
    public Result getOrderList(@RequestParam int page, @RequestParam int limit, @RequestParam(required = false) String address, @RequestParam(required = false) String phone){
        return orderInfoService.getAllOrderList(page,limit,address,phone);
    }

    @ApiOperation("更新订单")
    @PostMapping("/update")
    public Result updateOrder(@RequestBody OrderInfo orderInfo){
        return orderInfoService.updateOrder(orderInfo);
    }
}
