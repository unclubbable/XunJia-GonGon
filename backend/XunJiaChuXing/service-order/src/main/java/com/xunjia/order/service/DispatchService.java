package com.xunjia.order.service;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.xunjia.api.Client.ServiceDriverUserClient;
import com.xunjia.api.Client.ServiceMapClient;
import com.xunjia.api.Client.ServiceWsPushClient;
import com.xunjia.api.dto.OrderInfo;
import com.xunjia.api.request.PushRequest;
import com.xunjia.api.response.AroundsearchResponse;
import com.xunjia.api.response.OrderDriverResponse;
import com.xunjia.api.response.TerminalResponse;
import com.xunjia.api.result.Result;
import com.xunjia.api.result.ResultCodeEnum;
import com.xunjia.api.util.FeignResultUtils;
import com.xunjia.api.util.WsMessageUtils;
import com.xunjia.common.constant.IdentityConstant;
import com.xunjia.common.constant.OrderConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xunjia.order.mapper.OrderInfoMapper;
import com.xunjia.order.rabbitMQ.DispatchMessage;
import com.xunjia.order.rabbitMQ.RabbitMQConfig;
import com.xunjia.order.rabbitMQ.RabbitMQProducer;
import com.xunjia.order.service.OrderTripService;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONObject;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

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
    private ServiceWsPushClient serviceWsPushClient;
    @Autowired
    private ServiceMapClient serviceMapClient;
    @Autowired
    private OrderTripService orderTripService;
    @Autowired
    private RabbitMQProducer rabbitMQProducer;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * MQ 消费入口：单轮搜车；暂无司机则投递 TTL 延迟消息，满次仍失败才置无效。
     * 已取消/已处理：空跑返回，不覆盖状态。
     */
    public Result handleDispatch(Long orderId, int retryCount, OrderInfo snapshot) {
        if (orderId == null) {
            return Result.fail().message("orderId 为空");
        }
        OrderInfo current = orderInfoMapper.selectById(orderId);
        if (current == null || current.getOrderStatus() != OrderConstants.ORDER_START) {
            log.info("派单跳过：订单已处理或不存在 orderId={} status={}",
                    orderId, current == null ? null : current.getOrderStatus());
            return Result.ok().message("订单已处理");
        }

        OrderInfo orderInfo = snapshot != null ? snapshot : current;
        orderInfo.setId(orderId);
        // 以库状态为准；快照补行程字段
        if (orderInfo.getDepLongitude() == null || orderInfo.getDepLatitude() == null) {
            orderTripService.mergeTrip(orderInfo);
        }

        Result<Boolean> booleanResult = dispatchRealTimeOrder(orderInfo);
        if (Boolean.TRUE.equals(booleanResult.getData()) && "success".equals(booleanResult.getMessage())) {
            return Result.ok("派单成功");
        }
        if (Boolean.TRUE.equals(booleanResult.getData()) && "fail".equals(booleanResult.getMessage())) {
            return Result.fail(ResultCodeEnum.ORDER_CANCEL_ERROR, "订单已取消");
        }

        // 暂无司机：再查一次库，避免取消后仍投递延迟或写成无效
        OrderInfo latest = orderInfoMapper.selectById(orderId);
        if (latest == null || latest.getOrderStatus() != OrderConstants.ORDER_START) {
            log.info("搜车未果但订单已非待接单，停止重试 orderId={} status={}",
                    orderId, latest == null ? null : latest.getOrderStatus());
            return Result.ok().message("订单已处理");
        }

        int nextRetry = retryCount + 1;
        if (nextRetry < RabbitMQConfig.MAX_DISPATCH_ATTEMPTS) {
            scheduleRetry(orderId, nextRetry, latest);
            return Result.ok().message("已安排延迟重试");
        }

        markDispatchFailed(latest);
        return Result.fail(ResultCodeEnum.DISPATCH_FAILED);
    }

    /** 兼容旧调用名 */
    public Result disPatch(OrderInfo orderInfo) {
        if (orderInfo == null || orderInfo.getId() == null) {
            return Result.fail().message("订单为空");
        }
        return handleDispatch(orderInfo.getId(), 0, orderInfo);
    }

    private void scheduleRetry(Long orderId, int retryCount, OrderInfo latest) {
        try {
            DispatchMessage msg = new DispatchMessage();
            msg.setOrderId(orderId);
            msg.setRetryCount(retryCount);
            msg.setOrderSnapshot(latest);
            String json = objectMapper.writeValueAsString(msg);
            rabbitMQProducer.sendDispatchRetryDelay(json);
            log.info("派单延迟重试已投递 orderId={} retryCount={} delayMs={}",
                    orderId, retryCount, RabbitMQConfig.DISPATCH_RETRY_DELAY_MS);
        } catch (Exception e) {
            log.error("投递派单延迟消息失败 orderId={} retryCount={}", orderId, retryCount, e);
            throw new RuntimeException("投递派单延迟消息失败", e);
        }
    }

    private void markDispatchFailed(OrderInfo orderInfo) {
        // 再次确认仍为待接单，避免覆盖乘客取消
        OrderInfo latest = orderInfoMapper.selectById(orderInfo.getId());
        if (latest == null || latest.getOrderStatus() != OrderConstants.ORDER_START) {
            log.info("置无效前订单已变更，跳过 orderId={}", orderInfo.getId());
            return;
        }
        log.warn("未找到司机，修改订单状态为无效 orderId={}", latest.getId());
        latest.setOrderStatus(OrderConstants.ORDER_INVALID);
        orderInfoMapper.updateById(latest);

        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId", latest.getId());
        passengerContent.put("driverId", latest.getDriverId());
        PushRequest passengerPushRequest = new PushRequest();
        passengerPushRequest.setUserId(latest.getPassengerId());
        passengerPushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        passengerPushRequest.setContent(WsMessageUtils.orderStatus(passengerContent));
        serviceWsPushClient.push(passengerPushRequest);
    }

    public Result<Boolean> dispatchRealTimeOrder(OrderInfo orderInfo) {
        OrderInfo orderInfoNow = orderInfoMapper.selectById(orderInfo.getId());
        if (orderInfoNow == null) {
            return Result.ok(true).message("fail");
        }
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
                        log.info("找到出车司机 vehicleNo={}", vehicleNo);
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

                        // 业务前缀 + 司机 ID；tryLock 仅 wait、不设 lease → Redisson 看门狗续期（对齐原 lock.lock）
                        String lockKey = "xunjia:dispatch:driver:" + driverId;
                        RLock lock = redissonClient.getLock(lockKey);
                        boolean locked = false;
                        try {
                            locked = lock.tryLock(2, TimeUnit.SECONDS);
                            if (!locked) {
                                log.warn("未抢到派单锁，跳过司机 driverId={}", driverId);
                                continue;
                            }
                            if (isDriverOrderGoingOn(driverId) > 0) {
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
                            pushRequest.setContent(WsMessageUtils.orderDispatch(driverContent));
                            serviceWsPushClient.push(pushRequest);

                            JSONObject passengerContent = new JSONObject();
                            passengerContent.put("orderId", orderInfo.getId());
                            passengerContent.put("driverId", orderInfo.getDriverId());
                            passengerContent.put("driverPhone", orderInfo.getDriverPhone());
                            PushRequest passengerPushRequest = new PushRequest();
                            passengerPushRequest.setUserId(orderInfo.getPassengerId());
                            passengerPushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
                            passengerPushRequest.setContent(WsMessageUtils.orderDispatch(passengerContent));
                            serviceWsPushClient.push(passengerPushRequest);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            log.warn("获取派单锁被中断 driverId={}", driverId, e);
                            continue;
                        } finally {
                            if (locked && lock.isHeldByCurrentThread()) {
                                lock.unlock();
                            }
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
    private Long isDriverOrderGoingOn(Long driverId) {
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
