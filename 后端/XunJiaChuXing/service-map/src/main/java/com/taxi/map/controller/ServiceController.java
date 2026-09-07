package com.taxi.map.controller;

import com.taxi.api.result.Result;
import com.taxi.map.service.ServiceFromMapService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/service")
public class ServiceController {

    @Autowired
    private ServiceFromMapService serviceFromMapService;

    @ApiOperation("创建服务(已经创建过了，不用调用)")
    @PostMapping("/add")
    public Result add(String name){
        return serviceFromMapService.add(name);
    }
}
