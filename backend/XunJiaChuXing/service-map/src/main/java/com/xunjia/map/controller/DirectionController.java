package com.xunjia.map.controller;

import com.xunjia.api.request.ForecastPriceDTO;
import com.xunjia.api.result.Result;
import com.xunjia.map.service.DirectionService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/direction")
public class DirectionController {

    @Autowired
    private DirectionService directionService;

    @ApiOperation("获取距离和时长")
    @PostMapping("/driving")
    public Result driving(@RequestBody ForecastPriceDTO forecastPriceDTO){
        return directionService.driving(forecastPriceDTO);
    }
}
