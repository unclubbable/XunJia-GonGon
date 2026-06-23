package com.taxi.driverUser.controller;

import com.taxi.api.result.Result;
import com.taxi.driverUser.service.CityDriverUserService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;



@RestController
@RequestMapping("/city-driver")
public class CityDriverController {
    @Autowired
    private CityDriverUserService cityDriverUserService;

    @ApiOperation("查询当前城市是否有可用司机")  // 简单的查count
    @GetMapping("/is-alailable-driver/{cityCode}")
    public Result<Boolean> isAvailableDriver(@PathVariable String cityCode){
        return cityDriverUserService.isAvailableDriver(cityCode);
    }
}
