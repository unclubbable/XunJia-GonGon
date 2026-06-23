package com.taxi.map.service;

import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceOrderClient;
import com.taxi.api.Client.ServiceSsePushClient;
import com.taxi.api.dto.Car;
import com.taxi.api.dto.OrderInfo;
import com.taxi.api.request.ApiDriverPointRequest;
import com.taxi.api.request.PushRequest;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.OrderConstants;
import com.taxi.map.remote.PointClient;
import com.taxi.api.response.PointResponse;
import com.taxi.api.result.Result;
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
    private ServiceSsePushClient serviceSsePushClient;
    @Autowired
    private PointClient pointClient;
//    public Result upload(PointResponse pointResponse) {
    public Result upload(ApiDriverPointRequest apiDriverPointRequest) {
        //通过carid获取car,调用service-driver-user
        Car car = serviceDriverUserClient.getCarById(apiDriverPointRequest.getCarId()).getData();

        //通过car,获取tid,trid
        String tid = car.getTid();
        String trid = car.getTrid();

        //调用地图去上传
        PointResponse pointResponse = new PointResponse();
        pointResponse.setTid(tid);
        pointResponse.setTrid(trid);
        pointResponse.setPoints(apiDriverPointRequest.getPoints());
        Result upload = pointClient.upload(pointResponse);

        //司机未接单，上传自己的坐标就行，不用通知乘客
        if(apiDriverPointRequest.getOrderId()==null){
            return Result.ok();
        }
        OrderInfo orderInfo = serviceOrderInfoClient.detail(apiDriverPointRequest.getOrderId()).getData();
        // 到达目的地，不用通知乘客坐标了
        if(orderInfo.getOrderStatus() >= OrderConstants.PASSENGER_GETOFF){
            return Result.ok();
        }
        // 通知乘客
        JSONObject passengerContent = new JSONObject();
        passengerContent.put("orderId",orderInfo.getId());
        passengerContent.put("driverId", orderInfo.getDriverId());
        passengerContent.put("orderStatus",orderInfo.getOrderStatus());
        String[] currentLonLat = apiDriverPointRequest.getPoints()[0].getLocation().split(",");
        passengerContent.put("currentLongitude",currentLonLat[0]);
        passengerContent.put("currentLatitude",currentLonLat[1]);

        PushRequest pushRequest = new PushRequest();
        pushRequest.setUserId(orderInfo.getPassengerId());
        pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
        pushRequest.setContent(passengerContent.toString());
        serviceSsePushClient.push(pushRequest);



        return upload;
    }
}
