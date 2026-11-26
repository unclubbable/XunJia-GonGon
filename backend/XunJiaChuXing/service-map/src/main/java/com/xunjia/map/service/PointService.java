package com.xunjia.map.service;

import com.xunjia.api.Client.ServiceDriverUserClient;
import com.xunjia.api.Client.ServiceOrderClient;
import com.xunjia.api.Client.ServiceWsPushClient;
import com.xunjia.api.dto.Car;
import com.xunjia.api.dto.OrderInfo;
import com.xunjia.api.request.ApiDriverPointRequest;
import com.xunjia.api.request.PushRequest;
import com.xunjia.api.result.Result;
import com.xunjia.api.result.ResultCodeEnum;
import com.xunjia.api.util.FeignResultUtils;
import com.xunjia.api.util.WsMessageUtils;
import com.xunjia.common.constant.IdentityConstant;
import com.xunjia.common.constant.OrderConstants;
import com.xunjia.map.remote.PointClient;
import com.xunjia.api.response.PointResponse;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class PointService {
    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;
    @Autowired
    private ServiceOrderClient serviceOrderInfoClient;
    @Autowired
    private ServiceWsPushClient serviceWsPushClient;
    @Autowired
    private PointClient pointClient;

    public Result upload(ApiDriverPointRequest apiDriverPointRequest) {
        Car car = FeignResultUtils.checkAndGet(
                serviceDriverUserClient.getCarById(apiDriverPointRequest.getCarId()),
                ResultCodeEnum.CAR_NOT_EXISTS);

        PointResponse pointResponse = new PointResponse();
        pointResponse.setTid(car.getTid());
        pointResponse.setTrid(car.getTrid());
        pointResponse.setPoints(apiDriverPointRequest.getPoints());
        Result upload = pointClient.upload(pointResponse);

        // 无订单时仅上报司机实时位置（供派单周边搜索）
        if (apiDriverPointRequest.getOrderId() == null) {
            return Result.ok();
        }

        OrderInfo orderInfo = FeignResultUtils.checkAndGet(
                serviceOrderInfoClient.detail(apiDriverPointRequest.getOrderId()),
                ResultCodeEnum.ORDER_NOT_EXISTS);

        // 到达目的地后，不再通知乘客坐标
        if (orderInfo.getOrderStatus() >= OrderConstants.PASSENGER_GETOFF) {
            return Result.ok();
        }

        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId", orderInfo.getId());
        passengerContent.put("driverId", orderInfo.getDriverId());
        passengerContent.put("orderStatus", orderInfo.getOrderStatus());
        String[] currentLonLat = apiDriverPointRequest.getPoints()[0].getLocation().split(",");
        passengerContent.put("currentLongitude", currentLonLat[0]);
        passengerContent.put("currentLatitude", currentLonLat[1]);

        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(orderInfo.getPassengerId());
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        pushRequest.setContent(WsMessageUtils.locationUpdate(passengerContent));
        serviceWsPushClient.push(pushRequest);

        return upload;
    }
}

