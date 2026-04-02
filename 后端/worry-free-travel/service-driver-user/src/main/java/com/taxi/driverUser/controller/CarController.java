package com.taxi.driverUser.controller;


import com.taxi.api.dto.Car;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.ICarService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
public class CarController {
    @Autowired
    private ICarService iCarService;

    @ApiOperation("根据id获取车辆")
    @GetMapping("/get-car/{cid}")
    public Result getCarById(@PathVariable("cid") Long cid){
        return iCarService.getCar(cid);
    }

    @ApiOperation("添加或者更新车辆")
    @PostMapping("/car")
    public Result addCar(@RequestBody Car car){
        return iCarService.addCar(car);
    }
    @ApiOperation("删除车辆(如果绑定司机了，无法删除)")
    @DeleteMapping("/car/{cid}")
    public Result deleteCar(@PathVariable("cid") Long cid){
        return iCarService.removeByCid(cid);
    }

    @ApiOperation("查找所有车辆")
    @GetMapping("/car/list")
    public Result getCarList(@RequestParam int page,
                             @RequestParam int limit,
                             @RequestParam(required = false) String address,
                             @RequestParam(required = false) String vehicleNo){
        return iCarService.getCarList(page, limit, address, vehicleNo);
    }

}
