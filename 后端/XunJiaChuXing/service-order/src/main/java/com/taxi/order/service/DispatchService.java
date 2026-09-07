package com.taxi.order.service;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceMapClient;
import com.taxi.api.Client.ServiceSsePushClient;
import com.taxi.api.dto.OrderInfo;
import com.taxi.api.request.PushRequest;
import com.taxi.api.response.AroundsearchResponse;
import com.taxi.api.response.OrderDriverResponse;
import com.taxi.api.response.TerminalResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.util.FeignResultUtils;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.OrderConstants;
import com.taxi.order.mapper.OrderInfoMapper;
import com.taxi.order.service.OrderTripService;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONObject;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class DispatchService {
    @Autowired
    private OrderInfoMapper orderInfoMapper;
    @Autowired
    private RedissonClient redissonClient;
    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;
    @Autowired
    private ServiceSsePushClient serviceSsePushClient;
    @Autowired
    private ServiceMapClient serviceMapClient;
    @Autowired
    private OrderTripService orderTripService;

    /**
     * 订单匹配
     */
    public Result disPatch(OrderInfo orderInfo) {
        OrderInfo current = orderInfoMapper.selectById(orderInfo.getId());
        if (current == null || current.getOrderStatus() != OrderConstants.ORDER_START) {
            return Result.ok().message("订单已处理");
        }
        Result<Boolean> booleanResult = dispatchRealTimeOrder(orderInfo);
        for (int i = 0; i < 5; i++) {
            if (Boolean.TRUE.equals(booleanResult.getData())) {
                break;
            }
            try {
                Thread.sleep(20 * 1000);
                OrderInfo data = orderInfoMapper.selectById(orderInfo.getId());
                if (data == null || data.getOrderStatus() != OrderConstants.ORDER_START) {
                    break;
                }
                booleanResult = dispatchRealTimeOrder(orderInfo);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("派单等待被中断", e);
            }
        }
        if (Boolean.TRUE.equals(booleanResult.getData()) && "success".equals(booleanResult.getMessage())) {
            return Result.ok("派单成功").message(booleanResult.getMessage());
        }
        if (Boolean.TRUE.equals(booleanResult.getData()) && "fail".equals(booleanResult.getMessage())) {
            return Result.fail(ResultCodeEnum.ORDER_CANCEL_ERROR, "订单已取消");
        }
        if (!Boolean.TRUE.equals(booleanResult.getData())) {
            log.error("未找到司机，修改订单状态为无效");
            orderInfo.setOrderStatus(OrderConstants.ORDER_INVALID);
            orderInfoMapper.updateById(orderInfo);
            JSONObject passengerContent = new JSONObject();
            passengerContent.put("orderId", orderInfo.getId());
            passengerContent.put("driverId", orderInfo.getDriverId());

            PushRequest passengerPushRequest = new PushRequest();
            passengerPushRequest.setUserId(orderInfo.getPassengerId());
            passengerPushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
            passengerPushRequest.setContent(passengerContent.toString());
            serviceSsePushClient.push(passengerPushRequest);
            return Result.fail(ResultCodeEnum.DISPATCH_FAILED);
        }
        return Result.fail(ResultCodeEnum.DISPATCH_FAILED);
    }

    public Result<Boolean> dispatchRealTimeOrder(OrderInfo orderInfo) {
        OrderInfo orderInfoNow = orderInfoMapper.selectById(orderInfo.getId());
        if (orderInfoNow.getOrderStatus() == OrderConstants.ORDER_CANCEL ||
                orderInfoNow.getOrderStatus() == OrderConstants.ORDER_INVALID) {
            return Result.ok(true).message("fail");
        }
        // MQ 消息一般已带起终点；若缺失则从 order_trip 回填，保证周边搜可用
        if (orderInfo.getDepLongitude() == null || orderInfo.getDepLatitude() == null) {
            orderTripService.mergeTrip(orderInfo);
        }
        String depLongitude = orderInfo.getDepLongitude();
        String depLatitude = orderInfo.getDepLatitude();
        int radius = 2000;
        String center = depLatitude + "," + depLongitude;

        List<Integer> radiusList = new ArrayList<>();
        final int addNum = 1500;
        while (radius <= 5000) {
            radiusList.add(radius);
            radius += addNum;
        }

        List<TerminalResponse> data;
        AroundsearchResponse aroundsearchResponse = new AroundsearchResponse();
        aroundsearchResponse.setCenter(center);

        for (int i = 0; i < radiusList.size(); i++) {
            aroundsearchResponse.setRadius(radiusList.get(i));
            data = FeignResultUtils.checkAndGet(serviceMapClient.aroundsearch(aroundsearchResponse));
            log.debug("(周边搜索)高德调用结果" + JSONUtil.toJsonStr(data));
            if (data.size() > 0) {
                log.debug("(周边搜索)高德调用结果:周边有可用司机");
                for (int j = 0; j < data.size(); j++) {
                    TerminalResponse terminalResponse = data.get(j);
                    String vehicleNo = terminalResponse.getVehicleNo();
                    Result<OrderDriverResponse> availableDriver = serviceDriverUserClient.getAvailableDriver(vehicleNo);
                    if (availableDriver.isOk()) {
                        log.error("找到了正在出车的司机,车牌号为-" + vehicleNo);
                        OrderDriverResponse orderDriverResponse = availableDriver.getData();
                        if (orderDriverResponse == null) {
                            continue;
                        }
                        Long driverId = orderDriverResponse.getDriverId();
                        String vehicleTypeFromCar = orderDriverResponse.getVehicleType();
                        String vehicleType = orderInfo.getVehicleType();
                        if (!isSameVehicleType(vehicleType, vehicleTypeFromCar)) {
                            log.warn("车型不匹配，跳过派单。订单车型={}，车辆车型={}，车牌={}",
                                    vehicleType, vehicleTypeFromCar, vehicleNo);
                            continue;
                        }

                        String lockKey = (driverId + "").intern();
                        RLock lock = redissonClient.getLock(lockKey);
                        lock.lock();
                        try {
                            if (isDriverOrderGoingon(driverId) > 0) {
                                log.warn("司机{}已有进行中订单，跳过", driverId);
                                continue;
                            }
                            orderInfo.setDriverId(driverId);
                            orderInfo.setDriverPhone(orderDriverResponse.getDriverPhone());
                            orderInfo.setCarId(orderDriverResponse.getCarId());
                            String longitude = terminalResponse.getLongitude();
                            String latitude = terminalResponse.getLatitude();
                            orderInfo.setReceiveOrderCarLongitude(longitude);
                            orderInfo.setReceiveOrderCarLatitude(latitude);

                            orderInfo.setReceiveOrderTime(LocalDateTime.now());
                            orderInfo.setLicenseId(orderDriverResponse.getLicenseId());
                            orderInfo.setVehicleNo(vehicleNo);
                            orderInfo.setOrderStatus(OrderConstants.DRIVER_RECEIVE_ORDER);
                            orderInfo.setDriverId(driverId);
                            orderInfo.setDriverPhone(orderDriverResponse.getDriverPhone());

                            // 主表更新司机/状态；接单位置与时间写入 order_trip
                            orderInfoMapper.updateById(orderInfo);
                            orderTripService.saveFromOrder(orderInfo);

                            JSONObject driverContent = new JSONObject();
                            driverContent.put("orderId", orderInfo.getId());
                            driverContent.put("passengerId", orderInfo.getPassengerId());
                            driverContent.put("passengerPhone", orderInfo.getPassengerPhone());
                            PushRequest pushRequest = new PushRequest();
                            pushRequest.setUserId(driverId);
                            pushRequest.setIdentity(IdentityConstant.DRIVER_IDENTITY);
                            pushRequest.setContent(driverContent.toString());
                            serviceSsePushClient.push(pushRequest);

                            JSONObject passengerContent = new JSONObject();
                            passengerContent.put("orderId", orderInfo.getId());
                            passengerContent.put("driverId", orderInfo.getDriverId());
                            passengerContent.put("driverPhone", orderInfo.getDriverPhone());
                            PushRequest passengerPushRequest = new PushRequest();
                            passengerPushRequest.setUserId(orderInfo.getPassengerId());
                            passengerPushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
                            passengerPushRequest.setContent(passengerContent.toString());
                            serviceSsePushClient.push(passengerPushRequest);
                        } finally {
                            lock.unlock();
                        }
                        return Result.ok(true).message("success");
                    }
                }
            }
        }
        return Result.fail(ResultCodeEnum.AVAILABLE_DRIVER_EMPTY);
    }

    private boolean isSameVehicleType(String orderType, String carType) {
        if (orderType == null || carType == null) {
            return false;
        }
        return orderType.trim().equals(carType.trim());
    }

    /**
     * 司机是否占用中（不可再被派单）。
     * 含：接单～行程中～下车未付(2～6)。
     * 不含：已发起收款(7)——收款后与司机无关，不应耽误接下一单；支付完成(8)/取消(9)同理。
     */
    private Long isDriverOrderGoingon(Long driverId) {
        QueryWrapper<OrderInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("driver_id", driverId);
        queryWrapper.and(wrapper -> wrapper.eq("order_status", OrderConstants.DRIVER_RECEIVE_ORDER)
                .or().eq("order_status", OrderConstants.DRIVER_TO_PICK_UP_PASSENGER)
                .or().eq("order_status", OrderConstants.DRIVER_ARRIVED_DEPARTURE)
                .or().eq("order_status", OrderConstants.PICK_UP_PASSENGER)
                .or().eq("order_status", OrderConstants.PASSENGER_GETOFF)
        );
        return orderInfoMapper.selectCount(queryWrapper);
    }
}
