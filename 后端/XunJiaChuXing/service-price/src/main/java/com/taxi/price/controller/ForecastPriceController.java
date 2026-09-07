package com.taxi.price.controller;

import com.taxi.api.request.ForecastPriceDOT;
import com.taxi.api.result.Result;
import com.taxi.price.service.PriceService;
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
    public Result forecastPrice(@RequestBody ForecastPriceDOT forecastPriceDOT){
        return forecastPriceService.forecastPrice(forecastPriceDOT);
    }

    @ApiOperation("计算实际价格")
    @PostMapping("/calculate-price")
    public Result calculatePrice(@RequestParam Integer distance,@RequestParam Integer duration,
                                 @RequestParam String cityCode,@RequestParam String vehicleType){
        return forecastPriceService.calculatePrice(distance,duration,cityCode,vehicleType);
    }
}
