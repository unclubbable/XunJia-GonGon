package com.taxi.dispatch.service;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.api.Client.ServiceMapClient;
import com.taxi.api.Client.ServiceOrderClient;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.OrderConstants;
import com.taxi.api.dto.OrderInfo;
import com.taxi.dispatch.mapper.OrderInfoMapper;
import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceSsePushClient;
import com.taxi.api.request.PushRequest;
import com.taxi.api.response.AroundsearchResponse;
import com.taxi.api.response.OrderDriverResponse;
import com.taxi.api.response.TerminalResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
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
    private ServiceOrderClient serviceOrderClient;

    /**
     * 订单匹配
     * @param orderInfo
     * @return
     */
    public Result disPatch(OrderInfo orderInfo){
        //判断订单状态
        OrderInfo current = serviceOrderClient.detail(orderInfo.getId()).getData();
        if (current.getOrderStatus() != OrderConstants.ORDER_START) {
            // 订单已处理或无效，直接 ack 并返回
            return Result.ok().message("订单已处理");
        }
        //派单
        //根据经纬度和搜索范围，搜索附近是否有车
        Result<Boolean> booleanResult = dispatchRealTimeOrder(orderInfo);
        //定时任务的处理 20秒一次
        for (int i = 0; i < 5; i++) {
            //如果找到司机或者订单已取消就马上停止搜索
            if(booleanResult.getData()){
                break;
            }
            try {
                //休眠20秒
                Thread.sleep(20 * 1000);
                // 判断订单状态
                // 重新查询前先检查用户or司机是否取消了订单（避免取消订单了，还在查询------只有订单开始阶段才可以进行司机查询）
                OrderInfo data = serviceOrderClient.detail(orderInfo.getId()).getData();
                if(data == null || data.getOrderStatus() != OrderConstants.ORDER_START ){
                    break;
                }
                //重新查询
                booleanResult = dispatchRealTimeOrder(orderInfo);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        // 订单成功（查找到司机且派单成功）
        if(booleanResult.getData() && booleanResult.getMessage().equals("success")){
            return Result.ok("派单成功").message(booleanResult.getMessage()); // 成功了，订单信息已推送到司机和乘客了
        }
        // 订单失败（查找到司机但派单失败）
        if(booleanResult.getData() && booleanResult.getMessage().equals("fail")){
            return Result.fail("派单未成功").message("订单已取消");  // 用于停止当前线程，因为用户已取消了
        }
        // 订单失败（未找到司机，修改订单状态为无效)
        if (!booleanResult.getData()){
            log.error("未找到司机，修改订单状态为无效");
            orderInfo.setOrderStatus(OrderConstants.ORDER_INVALID);
            orderInfoMapper.updateById(orderInfo);
            // 通知乘客未找到司机
            JSONObject passengerContent = new JSONObject();
            passengerContent.put("orderId",orderInfo.getId());
            passengerContent.put("driverId", orderInfo.getDriverId());

            PushRequest passengerPushRequest = new PushRequest();
            passengerPushRequest.setUserId(orderInfo.getPassengerId());
            passengerPushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
            passengerPushRequest.setContent(passengerContent.toString());
            serviceSsePushClient.push(passengerPushRequest);
            return Result.fail("派单未成功").message("未能找到司机！");
        }
        return Result.fail();
    }

    public Result<Boolean> dispatchRealTimeOrder(OrderInfo orderInfo) {
        OrderInfo orderInfoNow = orderInfoMapper.selectById(orderInfo.getId());
        if(orderInfoNow.getOrderStatus() == OrderConstants.ORDER_CANCEL ||
                orderInfoNow.getOrderStatus() == OrderConstants.ORDER_INVALID){  // 订单已取消
            return Result.ok(true).message("fail");
        }
        //出发点经纬度
        String depLongitude = orderInfo.getDepLongitude();
        String depLatitude = orderInfo.getDepLatitude();
        //2km
        int radius = 2000;
        //拼接纬-经度
        String center = depLatitude + "," + depLongitude;

        List<Integer> radiusList = new ArrayList<>();  //2000 3500 5000
        final int addNum = 1500;
        while (radius <= 5000) {
            radiusList.add(radius);
            radius += addNum;
        }

        List<TerminalResponse> data = null;
        AroundsearchResponse aroundsearchResponse = new AroundsearchResponse();
        aroundsearchResponse.setCenter(center);

        for (int i = 0; i < radiusList.size(); i++) {
            aroundsearchResponse.setRadius(radiusList.get(i));
            //搜索周边
            data = serviceMapClient.aroundsearch(aroundsearchResponse).getData();
            log.debug("(周边搜索)高德调用结果"+ JSONUtil.toJsonStr(data));
            if (data.size() > 0) {
                log.debug("(周边搜索)高德调用结果:周边有可用司机");
                //解析终端
                for (int j = 0; j < data.size(); j++) {
                    TerminalResponse terminalResponse = data.get(j);
                    String vehicleNo = terminalResponse.getVehicleNo();
                    //查询是否有对应的可派单司机
                    Result<OrderDriverResponse> availableDriver = serviceDriverUserClient.getAvailableDriver(vehicleNo);
                    if (availableDriver.getCode().intValue() != ResultCodeEnum.FAIL.getCode().intValue()) {
                        log.error("找到了正在出车的司机,车牌号为-"+vehicleNo);
                        OrderDriverResponse orderDriverResponse = availableDriver.getData();
                        Long driverId = orderDriverResponse.getDriverId();
                        String vehicleTypeFromCar = orderDriverResponse.getVehicleType();
                        //判断车辆的车型是否符合?  一个是预估的，一个是查出来司机的
                        String vehicleType = orderInfo.getVehicleType();
                        if (!vehicleType.trim().equals(vehicleTypeFromCar.trim())) {
                            continue;
                        }

                        //锁司机Id  intern()在运行时常量池中检查字符串对象，并且如果常量池中已经存在相同内容的字符串，则返回常量池中的字符串对象的引用。
                        //上锁（分布式锁）
                        String lockKey = (driverId + "").intern();
                        RLock lock = redissonClient.getLock(lockKey);
                        lock.lock();
                        try{
                            // 判断司机 是否有进行中的订单
                            if (isDriverOrderGoingon(driverId) > 0) {
                                continue;
                            }
                            //设置订单中司机车辆相关的信息
                            orderInfo.setDriverId(driverId);
                            orderInfo.setDriverPhone(orderDriverResponse.getDriverPhone());
                            orderInfo.setCarId(orderDriverResponse.getCarId());
                            //从地图中来
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

                            orderInfoMapper.updateById(orderInfo);

                            //1.通知司机
                            JSONObject driverContent = new JSONObject();
                            driverContent.put("orderId",orderInfo.getId());
                            driverContent.put("passengerId", orderInfo.getPassengerId());
                            driverContent.put("passengerPhone", orderInfo.getPassengerPhone());
                            // 其他信息看前端需求封装
                            // 出发地经纬度
//                            driverContent.put("departure", orderInfo.getDeparture());
//                            driverContent.put("depLongitude", orderInfo.getDepLongitude());
//                            driverContent.put("depLatitude", orderInfo.getDepLatitude());
//                            //目的地经纬度
//                            driverContent.put("destination", orderInfo.getDestination());
//                            driverContent.put("destLongitude", orderInfo.getDestLongitude());
//                            driverContent.put("destLatitude", orderInfo.getDestLatitude());
                            //发送消息
                            PushRequest pushRequest = new PushRequest();
                            pushRequest.setUserId(driverId);
                            pushRequest.setIdentity(IdentityConstant.DRIVER_IDENTITY);
                            pushRequest.setContent(driverContent.toString());
                            serviceSsePushClient.push(pushRequest);

                            //2.通知乘客
                            JSONObject passengerContent = new JSONObject();
                            passengerContent.put("orderId",orderInfo.getId());
                            passengerContent.put("driverId", orderInfo.getDriverId());
                            passengerContent.put("driverPhone", orderInfo.getDriverPhone());
                            // 其他信息看前端需求封装
//                            //车辆信息,调用车辆服务
//                            Car car = serviceDriverUserClient.getCar(orderInfo.getCarId()).getData();
//                            //车辆颜色
//                            passengerContent.put("plateColor", car.getPlateColor());
//                            //品牌
//                            passengerContent.put("brand", car.getBrand());
//                            //车辆型号
//                            passengerContent.put("model", car.getModel());
//                            //车牌号
//                            passengerContent.put("vehicleNo", vehicleNo);
//                            //司机经纬度
//                            passengerContent.put("receiveOrderCarLongitude", orderInfo.getReceiveOrderCarLongitude());
//                            passengerContent.put("receiveOrderCarLatitude", orderInfo.getReceiveOrderCarLatitude());
                            //发送消息
                            PushRequest passengerPushRequest = new PushRequest();
                            passengerPushRequest.setUserId(orderInfo.getPassengerId());
                            passengerPushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
                            passengerPushRequest.setContent(passengerContent.toString());
                            serviceSsePushClient.push(passengerPushRequest);
                        }finally {
                            //解锁
                            lock.unlock();
                        }
                        //退出，不再进行司机的查找
                        return Result.ok(true).message("success");
                    }
                }
            }
        }
        return Result.fail(false).message("暂无可用司机");
    }

    /**
     * 判断司机是否有行进中的订单
     *
     * @param driverId
     * @return
     */
    private Long isDriverOrderGoingon(Long driverId) {
        // 判断有正在进行的订单不允许下单
        QueryWrapper<OrderInfo> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("driver_id", driverId);
        queryWrapper.and(wrapper -> wrapper.eq("order_status", OrderConstants.DRIVER_RECEIVE_ORDER)
                .or().eq("order_status", OrderConstants.DRIVER_TO_PICK_UP_PASSENGER)
                .or().eq("order_status", OrderConstants.DRIVER_ARRIVED_DEPARTURE)
                .or().eq("order_status", OrderConstants.PICK_UP_PASSENGER)
                .or().eq("order_status", OrderConstants.PASSENGER_GETOFF)
                .or().eq("order_status", OrderConstants.TO_START_PAY)
        );


        Long validOrderNumber = orderInfoMapper.selectCount(queryWrapper);

        return validOrderNumber;
    }

}
