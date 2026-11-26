package com.xunjia.map.service;

import cn.hutool.json.JSONUtil;
import com.xunjia.map.remote.MapDirectionClient;
import com.xunjia.api.request.ForecastPriceDTO;
import com.xunjia.api.response.DirectionResponse;
import com.xunjia.api.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Slf4j
@Service
public class DirectionService {

    @Autowired
    private MapDirectionClient mapDirectionClient;

    /** 算距离(米)和时长(分钟) */
    public Result driving(ForecastPriceDTO forecastPriceDTO) {
        String depLongitude = forecastPriceDTO.getDepLongitude();
        String depLatitude = forecastPriceDTO.getDepLatitude();
        String destLongitude = forecastPriceDTO.getDestLongitude();
        String destLatitude = forecastPriceDTO.getDestLatitude();
        DirectionResponse direction = mapDirectionClient.direction(depLongitude, depLatitude, destLongitude, destLatitude);
        log.debug("路径规划结果：{}", JSONUtil.toJsonStr(direction));
        return Result.ok(direction);
    }
}
