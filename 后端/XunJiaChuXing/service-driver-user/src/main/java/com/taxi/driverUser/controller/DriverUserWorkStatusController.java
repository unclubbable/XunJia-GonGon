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
@RequestMapping("/driver-user") // 司机端接口统一根路径
public class DriverUserWorkStatusController {

    @Autowired
    private IDriverUserWorkStatusService driverUserWorkStatusService;

    @ApiOperation("司机修改工作状态（出车时校验运营地行政区划）")
    @PostMapping("/driver-user-work-status")
    public Result changeWorkStatus(@RequestBody DriverUserWorkStatus driverUserWorkStatus){
        Long driverId = driverUserWorkStatus.getDriverId();
        Integer workStatus = driverUserWorkStatus.getWorkStatus();
        String address = driverUserWorkStatus.getAddress();
        log.info("修改司机工作状态：driverId：{}，workStatus：{},address：{}", driverId, workStatus, address);
        return driverUserWorkStatusService.changeWorkStatus(driverId, workStatus, address);
    }

    @ApiOperation("获取司机工作状态")
    @GetMapping("/work-status")
    public Result<DriverUserWorkStatus> getWorkStatus(Long driverId){
        return driverUserWorkStatusService.getWorkStatus(driverId);
    }

    @ApiOperation("管理端获取全部司机工作状态")
    @GetMapping("/driver-user-work-status")
    public Result getAllWorkStatusBoss(){
        return driverUserWorkStatusService.getAllWorkStatus();
    }

    @ApiOperation("管理端修改司机工作状态")
    @GetMapping("/driver-user-work-status/change")
    public Result changeWorkStatusBoss(Long driverId, Integer workStatus){
        return driverUserWorkStatusService.changeWorkStatusBoss(driverId, workStatus);
    }
}
