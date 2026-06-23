package com.taxi.driverUser.controller;

import com.taxi.api.dto.DriverUserMoney;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.DriverUserMoneyService;
import io.swagger.annotations.ApiOperation;
import org.apache.ibatis.annotations.Update;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/driver-user-money")
public class DriverUserMoneyController {
    @Autowired
    private DriverUserMoneyService driverUserMoneyService;

    @ApiOperation("获取全部司机收入订单表")
    @GetMapping()
    public Result getMoneyList(){
        return driverUserMoneyService.getMoneyList();
    }
    @ApiOperation("根据财务报表ID修改司机收入订单表")
    @PutMapping ()
    public Result putMoneyByDriverId(@RequestBody DriverUserMoney driverUserMoney){
        return driverUserMoneyService.putMoneyByDriverId(driverUserMoney);
    }

    @ApiOperation("获取司机最近几月收入信息")
    @GetMapping("/{driverId}/{RecentlyMonth}")
    public Result getMoneyByDriverIdYearMonth(
            @PathVariable Long driverId,
            @PathVariable Integer RecentlyMonth){
        return driverUserMoneyService.getMoneyByDriverIdYearMonth(driverId,RecentlyMonth);
    }

    @ApiOperation("司机完成订单后计入收入")
    @PostMapping("/{driverId}")
    public Result addMoneyByDriverId(
            @PathVariable Long driverId,
            @RequestBody Double Money){
        return driverUserMoneyService.addMoneyByDriverId(driverId,Money);
    }
}
