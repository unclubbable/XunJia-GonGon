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
import com.taxi.api.request.OrderRequest;
import com.taxi.api.request.PriceRuleIsNewRequest;
import com.taxi.api.response.TrsearchResponse;
import com.taxi.api.result.Result;
import com.taxi.order.service.IOrderInfoService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.taxi.common.util.RedisPrefixUtils;
import com.taxi.common.util.UserContext;
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
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;


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

    //通知
    @Autowired
    private ServiceSsePushClient serviceSsePushClient;

    @Override
    public Result add( OrderRequest orderRequest) {
        log.error("下单请求参数：" + orderRequest);
        // 判断当前用户是否是乘客
        if (UserContext.getUser().getIdentity().equals(IdentityConstant.PASSENGER_IDENTITY)){
            orderRequest.setPassengerPhone(UserContext.getUser().getPhone());
            PassengerUser user = servicePassengerUserClient.getUserByPhone(orderRequest.getPassengerPhone()).getData();
            orderRequest.setPassengerId(user.getId());
        }
        // 需要判断 下单的设备是否是 黑名单设备
//        if (isBlackDevice(orderRequest)) {
//            return Result.fail().message("该设备超过下单次数");
//        }

        // 判断：下单的城市和计价规则是否正常
        if (!isPriceRuleExists(orderRequest)) {
            return Result.fail().message("当前城市不提供叫车服务");
        }
        String cityCode = orderRequest.getAddress();
        // 测试当前城市是否有可用的司机
        Boolean availableDriver = serviceDriverUserClient.isAvailableDriver(cityCode).getData();
        if (!availableDriver) {
            return Result.fail().message("当前城市没有可用司机");
        }

        //需要判断计价规则版本是否最新
        PriceRuleIsNewRequest priceRuleIsNewRequest = new PriceRuleIsNewRequest();
        priceRuleIsNewRequest.setFareType(orderRequest.getFareType());
        priceRuleIsNewRequest.setFareVersion(orderRequest.getFareVersion());
        Boolean aNew = servicePriceClient.isNew(priceRuleIsNewRequest).getData();
        if (!aNew) {
            return Result.fail().message("计价规则不是最新的,请重新预估");
        }

        // 判断乘客是否有进行中的订单
        if (isPassengerOrderGoingon(orderRequest.getPassengerId()) > 0) {
            return Result.fail().message("有正在进行中的订单");
        }

        //创建订单
        OrderInfo orderInfo = new OrderInfo();
        BeanUtils.copyProperties(orderRequest, orderInfo);
        orderInfo.setOrderStatus(OrderConstants.ORDER_START);
        orderInfoMapper.insert(orderInfo);

        // 消息发到 mq
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            String orderInfoJson = objectMapper.writeValueAsString(orderInfo);
            rabbitMQProducer.sendMessage("travel-topic", orderInfoJson);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return Result.ok(orderInfo);
    }




    //判断是否有 计价规则
    private boolean isPriceRuleExists(OrderRequest orderRequest) {
        String fareType = orderRequest.getFareType();
        int index = fareType.indexOf("$");
        String cityCode = fareType.substring(0, index);
        String vehicleType = fareType.substring(index + 1);

        PriceRule priceRule = new PriceRule();
        priceRule.setCityCode(cityCode);
        priceRule.setVehicleType(vehicleType);

        return servicePriceClient.ifPriceExists(cityCode, vehicleType).getData();
    }

    /**
     * 判断乘客是否有进行中的订单
     *
     * @param passengerId
     * @return
     */
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

    /**
     * 去接乘客
     *
     * @param orderRequest
     * @return
     */
    @Override
    public Result<OrderInfo> toPickUpPassenger(OrderRequest orderRequest) {
        OrderInfo orderInfo = baseMapper.selectById(orderRequest.getOrderId());
        orderInfo.setToPickUpPassengerLongitude(orderRequest.getToPickUpPassengerLongitude());
        orderInfo.setToPickUpPassengerLatitude(orderRequest.getToPickUpPassengerLatitude());
        orderInfo.setToPickUpPassengerAddress(orderRequest.getToPickUpPassengerAddress());

        orderInfo.setToPickUpPassengerTime(LocalDateTime.now());

        orderInfo.setOrderStatus(OrderConstants.DRIVER_TO_PICK_UP_PASSENGER);
        baseMapper.updateById(orderInfo);                       //更新数据库信息
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

    /**
     * 司机到达乘客起点
     *
     * @param orderRequest
     * @return
     */
    @Override
    public Result<OrderInfo> arrivedDeparture(OrderRequest orderRequest) {
        OrderInfo orderInfo = baseMapper.selectById(orderRequest.getOrderId());
        orderInfo.setOrderStatus(OrderConstants.DRIVER_ARRIVED_DEPARTURE);

        orderInfo.setDriverArrivedDepartureTime(LocalDateTime.now());

        baseMapper.updateById(orderInfo);       //更新数据库信息
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

    /**
     * 乘客上车
     *
     * @param orderRequest
     * @return
     */
    @Override
    public Result<OrderInfo> pickUpPassenger(OrderRequest orderRequest) {
        OrderInfo orderInfo = baseMapper.selectById(orderRequest.getOrderId());
        orderInfo.setOrderStatus(OrderConstants.PICK_UP_PASSENGER);

        orderInfo.setPickUpPassengerLongitude(orderRequest.getPickUpPassengerLongitude());
        orderInfo.setPickUpPassengerLatitude(orderRequest.getPickUpPassengerLatitude());
        orderInfo.setPickUpPassengerTime(LocalDateTime.now());

        baseMapper.updateById(orderInfo);           //更新数据库信息
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

    /**
     * 到达目的地，乘客下车
     *
     * @param orderRequest
     * @return
     */
    @Override
    public Result<OrderInfo> passengerGetOff(OrderRequest orderRequest) {
        OrderInfo orderInfo = baseMapper.selectById(orderRequest.getOrderId());
        orderInfo.setOrderStatus(OrderConstants.PASSENGER_GETOFF);

        orderInfo.setPassengerGetoffLongitude(orderRequest.getPassengerGetoffLongitude());
        orderInfo.setPassengerGetoffLatitude(orderRequest.getPassengerGetoffLatitude());
        orderInfo.setPassengerGetoffTime(LocalDateTime.now());

        //订单行程的路程和时间
        Car car = serviceDriverUserClient.getCar(orderInfo.getCarId()).getData();
        long startTime = orderInfo.getPickUpPassengerTime().toInstant(ZoneOffset.of("+8")).toEpochMilli();
        long endTime = LocalDateTime.now().toInstant(ZoneOffset.of("+8")).toEpochMilli();
        TrsearchResponse trsearchResponse = serviceMapClient.trsearch(car.getTid(), startTime, endTime).getData();

        Long driveMile = trsearchResponse.getDriveMile();
        Long driveTime = trsearchResponse.getDriveTime();
        orderInfo.setDriveMile(driveMile);
        orderInfo.setDriveTime(driveTime);

        //获取价格
        String address = orderInfo.getAddress();
        String vehicleType = orderInfo.getVehicleType();
        Double price = servicePriceClient.calculatePrice(driveMile.intValue(), driveTime.intValue(), address, vehicleType).getData();
        orderInfo.setPrice(price);

        baseMapper.updateById(orderInfo);           //更新数据库信息

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

    /**
     * 支付
     * @param orderRequest
     * @return
     */
    @Override
    public Result pay(OrderRequest orderRequest) {
        Long orderId = orderRequest.getOrderId();
        OrderInfo orderInfo = baseMapper.selectById(orderId);

        orderInfo.setOrderStatus(OrderConstants.SUCCESS_PAY);
        baseMapper.updateById(orderInfo);
        return Result.ok();
    }

    /**
     * 订单取消
     *
     * @param orderId 订单id
     * @return
     */
    @Override
    public Result cancel(Long orderId) {
        //根据当前用户信息判断是司机还是用户(IdentityConstant.DRIVER_IDENTITY)(IdentityConstant.PASSENGER_IDENTITY)
        String identity = UserContext.getUser().getIdentity();

        //查询订单当前状态
        OrderInfo orderInfo = baseMapper.selectById(orderId);
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
            return Result.fail().message("订单无法取消");
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

    /**
     * 司机推送支付信息，订单完成
     * TODO 分布式事务
     * @return
     */
    @Override
//    @GlobalTransactional
    @Transactional
    public Result pushPayInfo(Long orderId, String price,Long passengerId) {
        //修改订单状态
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setOrderId(orderId);

        OrderInfo orderInfo = baseMapper.selectById(orderId);
        orderInfo.setOrderStatus(OrderConstants.TO_START_PAY);
        // 更新订单状态
        baseMapper.updateById(orderInfo);
        // 司机完单总数加一
        serviceDriverUserClient.addDriverTotalOrders(orderInfo.getDriverId());

        // 获取订单详情
        orderInfo = serviceOrderClient.detail(orderId).getData();
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

    /**
     * 判断当前用户是否有正在进行的订单
     * @param phone
     * @param identity
     * @return
     */
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
        return Result.ok(orderInfo);
    }

    /**
     * 通过id获取当前订单详情
     * @param orderId
     * @return
     */
    @Override
    public Result<OrderDetailInfo> currentOrderDetail(Long orderId) {
        log.debug("通过id获取当前订单详情");
        log.debug("orderId:"+orderId);
        OrderDetailInfo orderDetailInfo = new OrderDetailInfo();
        OrderInfo orderInfo = baseMapper.selectById(orderId);
        // 司机信息
        DriverUser driverInfo = serviceDriverUserClient.getDriverInfo(orderInfo.getDriverId()).getData();
        BeanUtils.copyProperties(orderInfo,orderDetailInfo);
        orderDetailInfo.setDriverSurname(driverInfo.getDriverSurname());
        orderDetailInfo.setDriverTotalOrders(driverInfo.getTotalOrders());
        //车辆信息,调用车辆服务
        Car car = serviceDriverUserClient.getCar(orderInfo.getCarId()).getData();
        //车辆颜色
        orderDetailInfo.setVehicleColor(car.getVehicleColor());
        //品牌
        orderDetailInfo.setVehicleBrand(car.getBrand());
        //车辆型号
        orderDetailInfo.setVehicleModel(car.getModel());
        // 乘客信息
        PassengerUser passengerInfo = servicePassengerUserClient.getPassengerInfo(orderInfo.getPassengerId()).getData();
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
        }
        ArrayList<OrderInfo> orderInfoList = (ArrayList<OrderInfo>) baseMapper.selectList(queryWrapper);
        return Result.ok(orderInfoList);
    }

    @Override
    public Result<OrderInfo> detail(Long orderId) {
        OrderInfo orderInfo =  baseMapper.selectById(orderId);
        return Result.ok(orderInfo);
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
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    @Override
    public Result updateOrder(OrderInfo orderInfo){
        OrderInfo order = orderInfoMapper.selectById(orderInfo.getId());
        if(ObjectUtils.isEmpty(order)){
            return Result.fail().message("更新失败,参数异常！");
        }
        orderInfoMapper.updateById(orderInfo);
        return Result.ok();
    }


}
