package com.xunjia.price.controller;

import com.xunjia.api.request.ForecastPriceDTO;
import com.xunjia.api.result.Result;
import com.xunjia.price.service.PriceService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class ForecastPriceController {
    @Autowired
    private PriceService forecastPriceService;

    @ApiOperation("计算预估价格")
    @PostMapping("/forecast-price")
    public Result forecastPrice(@RequestBody ForecastPriceDTO forecastPriceDTO){
        return forecastPriceService.forecastPrice(forecastPriceDTO);
    }

    @ApiOperation("计算实际价格")
    @PostMapping("/calculate-price")
    public Result calculatePrice(@RequestParam Integer distance,@RequestParam Integer duration,
                                 @RequestParam String cityCode,@RequestParam String vehicleType){
        return forecastPriceService.calculatePrice(distance,duration,cityCode,vehicleType);
    }
}
