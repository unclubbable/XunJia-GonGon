package com.taxi.driverUser.controller;


import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.IDriverCarBindingRelationshipService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/driver_car_binging_relationship")
@RestController
public class DriverCarBindingRelationshipController {
    @Autowired
    private IDriverCarBindingRelationshipService driverCarBindingRelationshipService;

    @ApiOperation("司机绑定-条件-司机与车绑定信息不能重复-司机只能绑定一个车，车只能绑定一个司机")
    @PostMapping("/bind")
    public Result bind(@RequestBody DriverCarBindingRelationship driverCarBindingRelationship){
        return driverCarBindingRelationshipService.bind(driverCarBindingRelationship);
    }

    @ApiOperation("司机解绑")
    @PostMapping("/unbind")
    public Result unbind(@RequestBody DriverCarBindingRelationship driverCarBindingRelationship){
        return driverCarBindingRelationshipService.unbind(driverCarBindingRelationship);
    }
    @ApiOperation("获取全部绑定信息")
    @GetMapping("list")
    public Result getBindingList(){
        return Result.ok(driverCarBindingRelationshipService.list());
    }

}
