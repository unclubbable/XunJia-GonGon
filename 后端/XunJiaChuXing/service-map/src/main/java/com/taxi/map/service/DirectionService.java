package com.taxi.map.service;

import cn.hutool.json.JSONUtil;
import com.taxi.map.remote.MapDirectionClient;
import com.taxi.api.request.ForecastPriceDOT;
import com.taxi.api.response.DirectionResponse;
import com.taxi.api.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Slf4j
@Service
public class DirectionService {

    @Autowired
    private MapDirectionClient mapDirectionClient;

    /** 算距离(米)和时长(分钟) */
    public Result driving(ForecastPriceDOT forecastPriceDOT) {
        String depLongitude = forecastPriceDOT.getDepLongitude();
        String depLatitude = forecastPriceDOT.getDepLatitude();
        String destLongitude = forecastPriceDOT.getDestLongitude();
        String destLatitude = forecastPriceDOT.getDestLatitude();
        //调用地图接口
        DirectionResponse direction = mapDirectionClient.direction(depLongitude, depLatitude, destLongitude, destLatitude);
        log.error(JSONUtil.toJsonStr( direction));
        return Result.ok(direction);
    }
}
