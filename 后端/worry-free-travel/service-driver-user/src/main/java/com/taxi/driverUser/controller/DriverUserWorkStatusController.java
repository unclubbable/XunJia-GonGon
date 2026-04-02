package com.taxi.driverUser.controller;


import com.taxi.api.dto.DriverUserWorkStatus;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.IDriverUserWorkStatusService;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * <p>
 *  前端控制器
 * </p>
 *
 */
@Slf4j
@RestController
public class DriverUserWorkStatusController {

    @Autowired
    private IDriverUserWorkStatusService driverUserWorkStatusService;

    @ApiOperation("司机修改工作状态（内有城市编码验证）")
    @PostMapping("/driver-user-work-status")
    public Result changeWorkStatus(@RequestBody DriverUserWorkStatus driverUserWorkStatus){
        Long driverId = driverUserWorkStatus.getDriverId();
        Integer workStatus = driverUserWorkStatus.getWorkStatus();
        String citycode = driverUserWorkStatus.getCitycode();
        log.info("修改司机工作状态：driverId：{}，workStatus：{},citycode：{}",driverId,workStatus,citycode);
        return driverUserWorkStatusService.changeWorkStatus(driverId,workStatus,citycode);
    }

    @ApiOperation("获取司机工作状态")
    @GetMapping("/work-status")
    public Result<DriverUserWorkStatus> getWorkStatus(Long driverId){
        return driverUserWorkStatusService.getWorkStatus(driverId);
    }

    @ApiOperation("司机修改运营城市")
    @PostMapping("/driver-user-work-city")
    public Result changeWorkCity(@RequestBody DriverUserWorkStatus driverUserWorkCity){
        Long driverId = driverUserWorkCity.getDriverId();
        String citycode = driverUserWorkCity.getCitycode();
        String adname = driverUserWorkCity.getAdname();
        String adcode = driverUserWorkCity.getAdcode();
        log.info("修改司机工作城市：driverId：{}，workCity：{}",driverId,adname);
        return driverUserWorkStatusService.changeWorkCity(driverId,adname,citycode,adcode);
    }
    @ApiOperation("管理端获取全部司机工作状态")
    @GetMapping("/driver-user-work-status")
    public Result<DriverUserWorkStatus> getAllWorkStatusBoss(){
        return driverUserWorkStatusService.getAllWorkStatus();
    }
    @ApiOperation("管理端修改司机工作状态")
    @GetMapping("/driver-user-work-status/change")
    public Result<DriverUserWorkStatus> changeWorkStatusBoss(Long driverId,Integer workStatus){
        return driverUserWorkStatusService.changeWorkStatusBoss(driverId,workStatus);
    }
}
