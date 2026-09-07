package com.taxi.order.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taxi.api.Client.*;
import com.taxi.api.request.PushRequest;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.OrderConstants;
import com.taxi.api.dto.*;
import com.taxi.order.rabbitMQ.RabbitMQProducer;
import com.taxi.order.mapper.OrderInfoMapper;
import com.taxi.api.constant.TrackSimplifyType;
import com.taxi.api.request.ForecastPriceDOT;
import com.taxi.api.request.OrderRequest;
import com.taxi.api.request.PriceRuleIsNewRequest;
import com.taxi.api.response.DirectionResponse;
import com.taxi.api.response.OrderTrackVO;
import com.taxi.api.response.TrackPointDTO;
import com.taxi.api.response.TrsearchResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.util.FeignResultUtils;
import com.taxi.api.util.OrderValidator;
import com.taxi.common.ThreadLoad.TokenResult;
import com.taxi.order.service.IOrderInfoService;
import com.taxi.order.service.OrderTripService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.taxi.common.util.RedisPrefixUtils;
import com.taxi.common.util.UserContext;
import io.seata.spring.annotation.GlobalTransactional;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONObject;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;


@Slf4j
@Service
public class OrderInfoServiceImpl extends ServiceImpl<OrderInfoMapper, OrderInfo> implements IOrderInfoService {
    @Autowired
    private OrderInfoMapper orderInfoMapper;
    @Autowired
    private ServicePriceClient servicePriceClient;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;
    @Autowired
    private ServiceMapClient serviceMapClient;
    @Autowired
    private RabbitMQProducer rabbitMQProducer;
    @Autowired
    private ServicePassengerUserClient servicePassengerUserClient;

    @Autowired
    private ServiceOrderClient serviceOrderClient;

    @Autowired
    private ServiceSsePushClient serviceSsePushClient;

    @Autowired
    private OrderTripService orderTripService;

    /** 按 id 加载订单并补 trip */
    private OrderInfo requireOrderWithTrip(Long orderId) {
        OrderInfo orderInfo = OrderValidator.requireOrder(baseMapper.selectById(orderId));
        return orderTripService.mergeTrip(orderInfo);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result add(OrderRequest orderRequest) {
        log.error("下单请求参数：" + orderRequest);
        if (UserContext.getUser().getIdentity().equals(IdentityConstant.PASSENGER_IDENTITY)) {
            orderRequest.setPassengerPhone(UserContext.getUser().getPhone());
            PassengerUser user = FeignResultUtils.checkAndGet(
                    servicePassengerUserClient.getUserByPhone(orderRequest.getPassengerPhone()),
                    ResultCodeEnum.USER_NOT_EXISTS);
            orderRequest.setPassengerId(user.getId());
        }

        if (!isPriceRuleExists(orderRequest)) {
            return Result.fail(ResultCodeEnum.CITY_SERVICE_NOT_SERVICE);
        }
        String cityCode = orderRequest.getAddress();
        Boolean availableDriver = FeignResultUtils.checkAndGet(
                serviceDriverUserClient.isAvailableDriver(cityCode));
        if (!Boolean.TRUE.equals(availableDriver)) {
            return Result.fail(ResultCodeEnum.CITY_DRIVER_EMPTY);
        }

        PriceRuleIsNewRequest priceRuleIsNewRequest = new PriceRuleIsNewRequest();
        priceRuleIsNewRequest.setFareType(orderRequest.getFareType());
        priceRuleIsNewRequest.setFareVersion(orderRequest.getFareVersion());
        Boolean isNew = FeignResultUtils.checkAndGet(servicePriceClient.isNew(priceRuleIsNewRequest));
        if (!Boolean.TRUE.equals(isNew)) {
            return Result.fail(ResultCodeEnum.PRICE_RULE_OUTDATED);
        }

        if (isPassengerOrderGoingon(orderRequest.getPassengerId()) > 0) {
            return Result.fail(ResultCodeEnum.ORDER_GOING_ON);
        }

        OrderInfo orderInfo = new OrderInfo();
        BeanUtils.copyProperties(orderRequest, orderInfo);
        orderInfo.setOrderStatus(OrderConstants.ORDER_START);
        // 主表只落主字段；行程字段 persist 在 order_trip（OrderInfo 上为 exist=false）
        orderInfoMapper.insert(orderInfo);
        orderTripService.insertFromOrder(orderInfo);

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            // MQ 消息仍带扁平行程字段，供派单直接使用起终点，无需再查库
            String orderInfoJson = objectMapper.writeValueAsString(orderInfo);
            rabbitMQProducer.sendMessage("travel-topic", orderInfoJson);
        } catch (Exception e) {
            log.error("订单消息发送失败, orderId={}", orderInfo.getId(), e);
        }

        return Result.ok(orderInfo);
    }




    private boolean isPriceRuleExists(OrderRequest orderRequest) {
        String fareType = orderRequest.getFareType();
        if (fareType == null || !fareType.contains("$")) {
            return false;
        }
        int index = fareType.indexOf("$");
        String cityCode = fareType.substring(0, index);
        String vehicleType = fareType.substring(index + 1);
        Boolean exists = FeignResultUtils.checkAndGet(
                servicePriceClient.ifPriceExists(cityCode, vehicleType));
        return Boolean.TRUE.equals(exists);
    }

    
    private Long isPassengerOrderGoingon(Long passengerId) {
        // 判断有正在进行的订单不允许下单
        QueryWrapper<OrderInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("passenger_id", passengerId);
        queryWrapper.and(wrapper -> wrapper.eq("order_status", OrderConstants.ORDER_START)
                .or().eq("order_status", OrderConstants.DRIVER_RECEIVE_ORDER)
                .or().eq("order_status", OrderConstants.DRIVER_TO_PICK_UP_PASSENGER)
                .or().eq("order_status", OrderConstants.DRIVER_ARRIVED_DEPARTURE)
                .or().eq("order_status", OrderConstants.PICK_UP_PASSENGER)
                .or().eq("order_status", OrderConstants.PASSENGER_GETOFF)
                .or().eq("order_status", OrderConstants.TO_START_PAY)
        );


        Long validOrderNumber = baseMapper.selectCount(queryWrapper);

        return validOrderNumber;

    }

    //判断是否 黑名单
    private boolean isBlackDevice(OrderRequest orderRequest) {
        String deviceCode = orderRequest.getDeviceCode();
        //生成Key
        String deviceCodeKey = RedisPrefixUtils.BLACK_DEVICE_CODE_PREFIX + deviceCode;
        Boolean hasKey = redisTemplate.hasKey(deviceCodeKey);
        if (hasKey) {
            String s = redisTemplate.opsForValue().get(deviceCodeKey);
            int i = Integer.parseInt(s);
            if (i >= 2) {
                //当前设备设置为黑名单
                return true;
            } else {
                redisTemplate.opsForValue().increment(deviceCodeKey);
            }
        }
        redisTemplate.opsForValue().setIfAbsent(deviceCodeKey, "1", 1L, TimeUnit.HOURS);
        return false;
    }

    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderInfo> toPickUpPassenger(OrderRequest orderRequest) {
        OrderInfo orderInfo = requireOrderWithTrip(orderRequest.getOrderId());
        OrderValidator.requireStatus(orderInfo, OrderConstants.DRIVER_RECEIVE_ORDER);
        orderInfo.setToPickUpPassengerLongitude(orderRequest.getToPickUpPassengerLongitude());
        orderInfo.setToPickUpPassengerLatitude(orderRequest.getToPickUpPassengerLatitude());
        orderInfo.setToPickUpPassengerAddress(orderRequest.getToPickUpPassengerAddress());

        orderInfo.setToPickUpPassengerTime(LocalDateTime.now());

        orderInfo.setOrderStatus(OrderConstants.DRIVER_TO_PICK_UP_PASSENGER);
        baseMapper.updateById(orderInfo);
        orderTripService.saveFromOrder(orderInfo);
        //通知乘客
        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId",orderInfo.getId());
        passengerContent.put("driverId", orderInfo.getDriverId());
        passengerContent.put("orderStatus", orderInfo.getOrderStatus());
        passengerContent.put("currentLongitude",orderInfo.getReceiveOrderCarLongitude());
        passengerContent.put("currentLatitude",orderInfo.getReceiveOrderCarLatitude());

        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(orderInfo.getPassengerId());
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        pushRequest.setContent(passengerContent.toString());
        serviceSsePushClient.push(pushRequest);
        return Result.ok(orderInfo);
    }

    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderInfo> arrivedDeparture(OrderRequest orderRequest) {
        OrderInfo orderInfo = requireOrderWithTrip(orderRequest.getOrderId());
        OrderValidator.requireStatus(orderInfo, OrderConstants.DRIVER_TO_PICK_UP_PASSENGER);
        orderInfo.setOrderStatus(OrderConstants.DRIVER_ARRIVED_DEPARTURE);

        orderInfo.setDriverArrivedDepartureTime(LocalDateTime.now());

        baseMapper.updateById(orderInfo);
        orderTripService.saveFromOrder(orderInfo);
        // 通知乘客
        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId",orderInfo.getId());
        passengerContent.put("driverId", orderInfo.getDriverId());
        passengerContent.put("orderStatus",orderInfo.getOrderStatus());
        passengerContent.put("currentLongitude",orderInfo.getDepLongitude());
        passengerContent.put("currentLatitude",orderInfo.getDepLatitude());

        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(orderInfo.getPassengerId());
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        pushRequest.setContent(passengerContent.toString());
        serviceSsePushClient.push(pushRequest);


        return Result.ok(orderInfo);
    }

    /** 乘客上车 */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderInfo> pickUpPassenger(OrderRequest orderRequest) {
        OrderInfo orderInfo = requireOrderWithTrip(orderRequest.getOrderId());
        OrderValidator.requireStatus(orderInfo, OrderConstants.DRIVER_ARRIVED_DEPARTURE);
        orderInfo.setOrderStatus(OrderConstants.PICK_UP_PASSENGER);

        orderInfo.setPickUpPassengerLongitude(orderRequest.getPickUpPassengerLongitude());
        orderInfo.setPickUpPassengerLatitude(orderRequest.getPickUpPassengerLatitude());
        orderInfo.setPickUpPassengerTime(LocalDateTime.now());

        baseMapper.updateById(orderInfo);
        orderTripService.saveFromOrder(orderInfo);
        // 通知乘客
        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId",orderInfo.getId());
        passengerContent.put("driverId", orderInfo.getDriverId());
        passengerContent.put("orderStatus",orderInfo.getOrderStatus());
        passengerContent.put("currentLongitude",orderInfo.getDepLongitude());
        passengerContent.put("currentLatitude",orderInfo.getDepLatitude());

        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(orderInfo.getPassengerId());
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        pushRequest.setContent(passengerContent.toString());
        log.error("通知乘客的信息:"+JSONUtil.toJsonStr(pushRequest));
        serviceSsePushClient.push(pushRequest);


        return Result.ok(orderInfo);
    }

    /** 乘客下车 */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderInfo> passengerGetOff(OrderRequest orderRequest) {
        OrderInfo orderInfo = requireOrderWithTrip(orderRequest.getOrderId());
        OrderValidator.requireStatus(orderInfo, OrderConstants.PICK_UP_PASSENGER);
        orderInfo.setOrderStatus(OrderConstants.PASSENGER_GETOFF);

        orderInfo.setPassengerGetoffLongitude(orderRequest.getPassengerGetoffLongitude());
        orderInfo.setPassengerGetoffLatitude(orderRequest.getPassengerGetoffLatitude());
        orderInfo.setPassengerGetoffTime(LocalDateTime.now());

        //订单行程的路程和时间
        Car car = FeignResultUtils.checkAndGet(serviceDriverUserClient.getCar(orderInfo.getCarId()),
                ResultCodeEnum.CAR_NOT_EXISTS);
        long startTime = orderInfo.getPickUpPassengerTime().toInstant(ZoneOffset.of("+8")).toEpochMilli();
        long endTime = LocalDateTime.now().toInstant(ZoneOffset.of("+8")).toEpochMilli();
        Long driveMile;
        Long driveTime;
        // 计价只需里程/时长：needPoints=false，避免无谓翻页拉全点拖慢下车结算
        Result<TrsearchResponse> trsearchResult = serviceMapClient.trsearch(
                car.getTid(), startTime, endTime, null, null, false);
        if (trsearchResult != null && trsearchResult.isOk() && trsearchResult.getData() != null) {
            driveMile = trsearchResult.getData().getDriveMile();
            driveTime = trsearchResult.getData().getDriveTime();
        } else {
            log.warn("高德轨迹为空，使用起终点路线预估兜底, orderId={}, message={}",
                    orderInfo.getId(), trsearchResult != null ? trsearchResult.getMessage() : "无响应");
            ForecastPriceDOT forecastPriceDOT = new ForecastPriceDOT();
            forecastPriceDOT.setDepLongitude(orderInfo.getDepLongitude());
            forecastPriceDOT.setDepLatitude(orderInfo.getDepLatitude());
            forecastPriceDOT.setDestLongitude(orderInfo.getDestLongitude());
            forecastPriceDOT.setDestLatitude(orderInfo.getDestLatitude());
            DirectionResponse direction = FeignResultUtils.checkAndGet(
                    serviceMapClient.driving(forecastPriceDOT), ResultCodeEnum.MAP_DISTRICT_ERROR);
            driveMile = direction.getDistance().longValue();
            driveTime = direction.getDuration().longValue() / 60L;
        }
        orderInfo.setDriveMile(driveMile);
        orderInfo.setDriveTime(driveTime);

        String address = orderInfo.getAddress();
        String vehicleType = orderInfo.getVehicleType();
        Double price = FeignResultUtils.checkAndGet(
                servicePriceClient.calculatePrice(driveMile.intValue(), driveTime.intValue(), address, vehicleType));
        orderInfo.setPrice(price);

        baseMapper.updateById(orderInfo);
        orderTripService.saveFromOrder(orderInfo);

        // 通知乘客
        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId",orderInfo.getId());
        passengerContent.put("driverId", orderInfo.getDriverId());
        passengerContent.put("orderStatus",orderInfo.getOrderStatus());
        passengerContent.put("currentLongitude",orderInfo.getDestLongitude());
        passengerContent.put("currentLatitude",orderInfo.getDestLatitude());

        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(orderInfo.getPassengerId());
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        pushRequest.setContent(passengerContent.toString());
        serviceSsePushClient.push(pushRequest);


        return Result.ok(orderInfo);
    }

    /** 支付 */
    @Override
    public Result pay(OrderRequest orderRequest) {
        OrderInfo orderInfo = OrderValidator.requireOrder(baseMapper.selectById(orderRequest.getOrderId()));
        OrderValidator.requireStatus(orderInfo, OrderConstants.TO_START_PAY, OrderConstants.PASSENGER_GETOFF);

        orderInfo.setOrderStatus(OrderConstants.SUCCESS_PAY);
        baseMapper.updateById(orderInfo);
        return Result.ok();
    }

    /** 取消订单 */
    @Override
    public Result cancel(Long orderId) {
        //根据当前用户信息判断是司机还是用户(IdentityConstant.DRIVER_IDENTITY)(IdentityConstant.PASSENGER_IDENTITY)
        String identity = UserContext.getUser().getIdentity();

        OrderInfo orderInfo = requireOrderWithTrip(orderId);
        Integer orderStatus = orderInfo.getOrderStatus();
        if(orderStatus == OrderConstants.ORDER_INVALID || orderStatus == OrderConstants.ORDER_CANCEL){
            return Result.ok(true).message("订单已取消");
        }

        LocalDateTime cancelTime = LocalDateTime.now();
        int cancelOperator = Integer.parseInt(IdentityConstant.PASSENGER_IDENTITY);
        Integer cancelTypeCode = null;

        //正常取消
        int cancelType = 0;
        //更新订单的取消状态
        //如果是乘客取消
        if (identity.trim().equals(IdentityConstant.PASSENGER_IDENTITY)) {
            switch (orderStatus) {
                //订单开始
                case OrderConstants.ORDER_START:
                    cancelTypeCode = OrderConstants.CANCEL_PASSENGER_BEFORE;
                    break;
                //司机接单  去接乘客   到达乘客上车点
                case OrderConstants.DRIVER_RECEIVE_ORDER:
                case OrderConstants.DRIVER_TO_PICK_UP_PASSENGER:
                case OrderConstants.DRIVER_ARRIVED_DEPARTURE:
                    LocalDateTime receiveOrderTime = orderInfo.getReceiveOrderTime();
                    long between = ChronoUnit.MINUTES.between(receiveOrderTime, cancelTime);
                    if (between > 2) {  //超过2分钟，则是乘客违约
                        cancelTypeCode = OrderConstants.CANCEL_PASSENGER_ILLEGAL;
                    } else {
                        cancelTypeCode = OrderConstants.CANCEL_PASSENGER_BEFORE;
                    }
                    break;
                default:
                    cancelType = 1;
                    break;
            }
        }
        //如果是司机取消
        else if (identity.trim().equals(IdentityConstant.DRIVER_IDENTITY)) {
            switch (orderStatus) {
                //司机接单  去接乘客   到达乘客上车点
                case OrderConstants.DRIVER_RECEIVE_ORDER:
                case OrderConstants.DRIVER_TO_PICK_UP_PASSENGER:
                case OrderConstants.DRIVER_ARRIVED_DEPARTURE:
                    LocalDateTime receiveOrderTime = orderInfo.getReceiveOrderTime();
                    long between = ChronoUnit.MINUTES.between(receiveOrderTime, cancelTime);
                    if (between > 2) {  // 司机违约
                        cancelTypeCode = OrderConstants.CANCEL_DRIVER_ILLEGAL;
                    } else {
                        cancelTypeCode = OrderConstants.CANCEL_DRIVER_BEFORE;
                    }
                    cancelOperator=Integer.parseInt(IdentityConstant.DRIVER_IDENTITY);
                    break;
                default:
                    cancelType = 2;
                    break;
            }
        }

        if (cancelType != 0) {
            return Result.fail(ResultCodeEnum.ORDER_CANCEL_ERROR);
        }
        orderInfo.setCancelTypeCode(cancelTypeCode);
        orderInfo.setCancelTime(cancelTime);
        orderInfo.setCancelOperator(cancelOperator);
        orderInfo.setOrderStatus(OrderConstants.ORDER_CANCEL);

        baseMapper.updateById(orderInfo);           //取消订单
        //给乘客及司机推送消息
        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(orderInfo.getPassengerId());
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        Result<String> result = new Result<String>();
        result.setCode(OrderConstants.RESULT_CODE_ORDER_CANCEL)
                .setMessage("订单取消成功");
        pushRequest.setContent(JSONUtil.toJsonStr(result));
        serviceSsePushClient.push(pushRequest);
        pushRequest.setUserId(orderInfo.getDriverId());
        pushRequest.setIdentity(IdentityConstant.DRIVER_IDENTITY);
        serviceSsePushClient.push(pushRequest);

        return Result.ok(true).message("订单取消成功");
    }

    /** 推送支付信息 TODO 分布式事务 */
    @Override
    @GlobalTransactional(rollbackFor = Exception.class)
    @Transactional
    public Result pushPayInfo(Long orderId, String price,Long passengerId) {
        //修改订单状态
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setOrderId(orderId);

        OrderInfo orderInfo = OrderValidator.requireOrder(baseMapper.selectById(orderId));
        OrderValidator.requireStatus(orderInfo, OrderConstants.PASSENGER_GETOFF);
        orderInfo.setOrderStatus(OrderConstants.TO_START_PAY);
        baseMapper.updateById(orderInfo);
        serviceDriverUserClient.addDriverTotalOrders(orderInfo.getDriverId());

        // detail 已做行程回填，推送里可用 departure/destination
        orderInfo = FeignResultUtils.checkAndGet(serviceOrderClient.detail(orderId), ResultCodeEnum.ORDER_NOT_EXISTS);
        //推送订单消息给乘客
        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId",orderInfo.getId());
        passengerContent.put("departure", orderInfo.getDeparture());
        passengerContent.put("destination", orderInfo.getDestination());
        passengerContent.put("price", price);
        passengerContent.put("driveTime", orderInfo.getDriveTime());
        passengerContent.put("driveMile", orderInfo.getDriveMile());
        passengerContent.put("orderStatus",OrderConstants.TO_START_PAY);
        passengerContent.put("currentLongitude",orderInfo.getDestLongitude());
        passengerContent.put("currentLatitude",orderInfo.getDestLatitude());

        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(passengerId);
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        pushRequest.setContent(passengerContent.toString());
        serviceSsePushClient.push(pushRequest);
        //推送订单消息给司机


        return Result.ok();
    }

    
    @Override
    public Result current(String phone, String identity) {
        QueryWrapper<OrderInfo> queryWrapper = new QueryWrapper<>();

        if (identity.equals(IdentityConstant.DRIVER_IDENTITY)){
            queryWrapper.eq("driver_phone",phone);
            queryWrapper.and(wrapper->wrapper
                    .eq("order_status",OrderConstants.DRIVER_RECEIVE_ORDER)
                    .or().eq("order_status",OrderConstants.DRIVER_TO_PICK_UP_PASSENGER)
                    .or().eq("order_status",OrderConstants.DRIVER_ARRIVED_DEPARTURE)
                    .or().eq("order_status",OrderConstants.PICK_UP_PASSENGER)
                    .or().eq("order_status",OrderConstants.PASSENGER_GETOFF)

            );
        }
        if (identity.equals(IdentityConstant.PASSENGER_IDENTITY)){
            queryWrapper.eq("passenger_phone",phone);
            queryWrapper.and(wrapper->wrapper.eq("order_status",OrderConstants.ORDER_START)
                    .or().eq("order_status",OrderConstants.DRIVER_RECEIVE_ORDER)
                    .or().eq("order_status",OrderConstants.DRIVER_TO_PICK_UP_PASSENGER)
                    .or().eq("order_status",OrderConstants.DRIVER_ARRIVED_DEPARTURE)
                    .or().eq("order_status",OrderConstants.PICK_UP_PASSENGER)
                    .or().eq("order_status",OrderConstants.PASSENGER_GETOFF)
                    .or().eq("order_status",OrderConstants.TO_START_PAY)
            );
        }
        OrderInfo orderInfo = baseMapper.selectOne(queryWrapper);
        if (orderInfo != null) {
            orderTripService.mergeTrip(orderInfo);
        }
        return Result.ok(orderInfo);
    }

    /** 订单详情 */
    @Override
    public Result<OrderDetailInfo> currentOrderDetail(Long orderId) {
        log.debug("通过id获取当前订单详情");
        log.debug("orderId:"+orderId);
        OrderDetailInfo orderDetailInfo = new OrderDetailInfo();
        OrderInfo orderInfo = requireOrderWithTrip(orderId);
        DriverUser driverInfo = FeignResultUtils.checkAndGet(
                serviceDriverUserClient.getDriverInfo(orderInfo.getDriverId()), ResultCodeEnum.DRIVER_NOT_EXITST);
        BeanUtils.copyProperties(orderInfo,orderDetailInfo);
        orderDetailInfo.setDriverSurname(driverInfo.getDriverSurname());
        orderDetailInfo.setDriverTotalOrders(driverInfo.getTotalOrders());
        //车辆信息,调用车辆服务
        Car car = FeignResultUtils.checkAndGet(serviceDriverUserClient.getCar(orderInfo.getCarId()),
                ResultCodeEnum.CAR_NOT_EXISTS);
        //车辆颜色
        orderDetailInfo.setVehicleColor(car.getVehicleColor());
        //品牌
        orderDetailInfo.setVehicleBrand(car.getBrand());
        //车辆型号
        orderDetailInfo.setVehicleModel(car.getModel());
        // 乘客信息
        PassengerUser passengerInfo = FeignResultUtils.checkAndGet(
                servicePassengerUserClient.getPassengerInfo(orderInfo.getPassengerId()), ResultCodeEnum.USER_NOT_EXISTS);
        orderDetailInfo.setPassengerSurname(passengerInfo.getPassengerSurname());

        return Result.ok(orderDetailInfo);
    }

    @Override
    public Result<ArrayList<OrderInfo>> getAllOrders(String phone, String identity) {
        QueryWrapper<OrderInfo> queryWrapper = new QueryWrapper<>();
        if (identity.equals(IdentityConstant.PASSENGER_IDENTITY)){
            queryWrapper.eq("passenger_phone", phone);
            queryWrapper.and(wrapper -> wrapper.ne("order_status", OrderConstants.ORDER_INVALID));
            queryWrapper.orderByDesc("id");
        } else if (identity.equals(IdentityConstant.DRIVER_IDENTITY)) {
            queryWrapper.eq("driver_phone", phone);
            queryWrapper.and(wrapper -> wrapper.ne("order_status", OrderConstants.ORDER_INVALID));
            // 司机端：最晚订单在前
            queryWrapper.orderByDesc("order_time").orderByDesc("id");
        }
        ArrayList<OrderInfo> orderInfoList = (ArrayList<OrderInfo>) baseMapper.selectList(queryWrapper);
        orderTripService.mergeTripBatch(orderInfoList);
        return Result.ok(orderInfoList);
    }

    @Override
    public Result<OrderInfo> detail(Long orderId) {
        if (orderId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "订单ID不能为空");
        }
        OrderInfo orderInfo = baseMapper.selectById(orderId);
        if (orderInfo == null) {
            return Result.fail(ResultCodeEnum.ORDER_NOT_EXISTS);
        }
        orderTripService.mergeTrip(orderInfo);
        return Result.ok(orderInfo);
    }

    /** 嵌套详情 {order, trip}，管理端用 */
    @Override
    public Result<OrderNestedVO> detailNested(Long orderId) {
        if (orderId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "订单ID不能为空");
        }
        OrderInfo orderInfo = baseMapper.selectById(orderId);
        if (orderInfo == null) {
            return Result.fail(ResultCodeEnum.ORDER_NOT_EXISTS);
        }
        // 主单可不合并扁平字段；toNested 直接读 order_trip
        return Result.ok(orderTripService.toNested(orderInfo));
    }

    /** 行程轨迹：鉴权后查 car.tid + 高德，返回上报点+关键节点 */
    @Override
    public Result<OrderTrackVO> orderTrack(Long orderId) {
        if (orderId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "订单ID不能为空");
        }
        TokenResult user = UserContext.getUser();
        if (user == null || StringUtils.isEmpty(user.getPhone()) || StringUtils.isEmpty(user.getIdentity())) {
            return Result.fail(ResultCodeEnum.TOKEN_ERROR);
        }

        OrderInfo orderInfo = baseMapper.selectById(orderId);
        if (orderInfo == null) {
            return Result.fail(ResultCodeEnum.ORDER_NOT_EXISTS);
        }
        orderTripService.mergeTrip(orderInfo);

        String identity = user.getIdentity().trim();
        String phone = user.getPhone().trim();
        boolean allowed = false;
        if (IdentityConstant.PASSENGER_IDENTITY.equals(identity)
                && phone.equals(orderInfo.getPassengerPhone())) {
            allowed = true;
        } else if (IdentityConstant.DRIVER_IDENTITY.equals(identity)
                && phone.equals(orderInfo.getDriverPhone())) {
            allowed = true;
        } else if (IdentityConstant.ADMIN_IDENTITY.equals(identity)) {
            allowed = true;
        }
        if (!allowed) {
            return Result.fail(ResultCodeEnum.ORDER_NO_PERMISSION);
        }

        OrderTrackVO vo = buildTrackVoFromOrder(orderInfo);

        if (orderInfo.getOrderStatus() != null
                && orderInfo.getOrderStatus() == OrderConstants.ORDER_CANCEL) {
            vo.setTip("订单已取消，暂无行程轨迹");
            return Result.ok(vo);
        }
        if (orderInfo.getCarId() == null) {
            vo.setTip("订单未绑定车辆，无法查询上报轨迹");
            return Result.ok(vo);
        }
        if (orderInfo.getPickUpPassengerTime() == null) {
            vo.setTip("乘客尚未上车，暂无行程轨迹");
            return Result.ok(vo);
        }

        Car car = FeignResultUtils.checkAndGet(serviceDriverUserClient.getCar(orderInfo.getCarId()),
                ResultCodeEnum.CAR_NOT_EXISTS);
        if (car == null || StringUtils.isEmpty(car.getTid())) {
            vo.setTip("车辆未绑定轨迹终端，无法查询上报轨迹");
            return Result.ok(vo);
        }

        long startTime = orderInfo.getPickUpPassengerTime().toInstant(ZoneOffset.of("+8")).toEpochMilli();
        LocalDateTime endLdt = orderInfo.getPassengerGetoffTime() != null
                ? orderInfo.getPassengerGetoffTime()
                : LocalDateTime.now();
        long endTime = endLdt.toInstant(ZoneOffset.of("+8")).toEpochMilli();
        if (endTime <= startTime) {
            vo.setTip("上车/下车时间无效，无法查询轨迹");
            return Result.ok(vo);
        }

        // 与管理端默认一致：距离抽稀 20m，拉全点再抽稀
        Result<TrsearchResponse> trsearchResult = serviceMapClient.trsearch(
                car.getTid(),
                startTime,
                endTime,
                TrackSimplifyType.BY_DISTANCE,
                20.0,
                true);
        if (trsearchResult != null && trsearchResult.isOk() && trsearchResult.getData() != null) {
            TrsearchResponse data = trsearchResult.getData();
            List<TrackPointDTO> points = data.getPoints() != null ? data.getPoints() : Collections.emptyList();
            vo.setPoints(points);
            vo.setDriveMile(data.getDriveMile());
            vo.setDriveTime(data.getDriveTime());
            vo.setRawPointCount(data.getRawPointCount());
            vo.setPointCount(data.getPointCount() != null ? data.getPointCount() : points.size());
            vo.setSimplifyType(data.getSimplifyType() != null
                    ? data.getSimplifyType()
                    : TrackSimplifyType.BY_DISTANCE);
            if (points.isEmpty()) {
                vo.setTip("该时段无上报轨迹点，已展示上车/下车关键节点");
            }
            return Result.ok(vo);
        }
        log.warn("订单轨迹查询失败或为空, orderId={}, message={}",
                orderId, trsearchResult != null ? trsearchResult.getMessage() : "无响应");
        vo.setTip("轨迹查询失败，已展示上车/下车关键节点");
        return Result.ok(vo);
    }

    private OrderTrackVO buildTrackVoFromOrder(OrderInfo orderInfo) {
        OrderTrackVO vo = new OrderTrackVO();
        vo.setPoints(new ArrayList<>());
        vo.setPointCount(0);
        vo.setRawPointCount(0);
        vo.setSimplifyType(TrackSimplifyType.BY_DISTANCE);
        vo.setDriveMile(orderInfo.getDriveMile());
        vo.setDriveTime(orderInfo.getDriveTime());
        vo.setDepLongitude(orderInfo.getDepLongitude());
        vo.setDepLatitude(orderInfo.getDepLatitude());
        vo.setDestLongitude(orderInfo.getDestLongitude());
        vo.setDestLatitude(orderInfo.getDestLatitude());
        vo.setReceiveOrderCarLongitude(orderInfo.getReceiveOrderCarLongitude());
        vo.setReceiveOrderCarLatitude(orderInfo.getReceiveOrderCarLatitude());
        vo.setToPickUpPassengerLongitude(orderInfo.getToPickUpPassengerLongitude());
        vo.setToPickUpPassengerLatitude(orderInfo.getToPickUpPassengerLatitude());
        vo.setPickUpPassengerLongitude(orderInfo.getPickUpPassengerLongitude());
        vo.setPickUpPassengerLatitude(orderInfo.getPickUpPassengerLatitude());
        vo.setPassengerGetoffLongitude(orderInfo.getPassengerGetoffLongitude());
        vo.setPassengerGetoffLatitude(orderInfo.getPassengerGetoffLatitude());
        return vo;
    }

    @Override
    public Result getAllOrderList(int page,int limit,String address,String phone){
        Page<OrderInfo> pageObj = new Page<>(page, limit);

        // 创建LambdaQueryWrapper
        LambdaQueryWrapper<OrderInfo> queryWrapper = new LambdaQueryWrapper<>();
        // 如果address不为空，添加到查询条件
        if (StringUtils.isNotEmpty(address)) {
            queryWrapper.eq(OrderInfo::getAddress, address);
        }
        // 如果phone不为空，添加到查询条件
        if (StringUtils.isNotEmpty(phone)) {
            queryWrapper.eq(OrderInfo::getDriverPhone,phone)
                    .or().eq(OrderInfo::getPassengerPhone,phone);
        }
        // 添加倒序排序条件
        queryWrapper.orderByDesc(OrderInfo::getId);

        IPage<OrderInfo> iPage = orderInfoMapper.selectPage(pageObj, queryWrapper);
        orderTripService.mergeTripBatch(iPage.getRecords());
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    @Override
    public Result updateOrder(OrderInfo orderInfo){
        OrderInfo order = orderInfoMapper.selectById(orderInfo.getId());
        if (ObjectUtils.isEmpty(order)) {
            return Result.fail(ResultCodeEnum.ORDER_UPDATE_ERROR);
        }
        // 仅更新主表（支付回调等场景）。行程字段请走生命周期接口写入 order_trip，避免局部更新把行程覆盖成 null。
        orderInfoMapper.updateById(orderInfo);
        return Result.ok();
    }


}
