package com.taxi.map.controller;

import com.taxi.api.request.ForecastPriceDOT;
import com.taxi.api.result.Result;
import com.taxi.map.service.DirectionService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/direction")
public class DriectionController {

    @Autowired
    private DirectionService directionService;

    @ApiOperation("获取距离和时长")
    @PostMapping("/driving")
    public Result driving(@RequestBody ForecastPriceDOT forecastPriceDOT){
        return directionService.driving(forecastPriceDOT);
    }
}
