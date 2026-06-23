package com.taxi.driverUser.controller;

import com.taxi.common.constant.DriverCarConstants;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.response.DriverUserExistsResponse;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.DriverUserService;
import com.taxi.driverUser.service.IDriverCarBindingRelationshipService;
import com.taxi.common.util.UserContext;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;


@RestController
public class DriverUserController {
    @Autowired
    private DriverUserService driverUserService;

    @Autowired
    private IDriverCarBindingRelationshipService driverCarBindingRelationshipService;


    @ApiOperation("根据id查询司机信息")
    @GetMapping("/get-driver-info/{driverId}")
    public Result<DriverUser> getDriverInfo(@PathVariable("driverId") Long driverId){
        return driverUserService.getDriverInfoById(driverId);
    }


    @ApiOperation("查找所有司机")
    @GetMapping("/driver-user/list")
    public Result getDriverUserList(
            @RequestParam int page,
            @RequestParam int limit,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String state){
        return driverUserService.getDriverUserList(page, limit, address, phone, state);
    }


    @ApiOperation("添加或者修改司机信息")
    @PostMapping("/driver-user")
    public Result addOrUpdateDriverUser(@RequestBody DriverUser driverUser){
        return driverUserService.addDriverUser(driverUser);
    }


    @ApiOperation("根据条件查询司机")
    @GetMapping("/check-driver/{driverPhone}")
    public Result<DriverUserExistsResponse> getUser(@PathVariable("driverPhone") String driverPhone){
        DriverUser driverUserDB = driverUserService.getDriverByPhone(driverPhone);

        int ifExists= DriverCarConstants.DRIVER_EXISTS;
        if(ObjectUtils.isEmpty(driverUserDB)){
            ifExists=DriverCarConstants.DRIVER_NOT_EXISTS;
        }

        DriverUserExistsResponse response = new DriverUserExistsResponse();
        response.setIfExists(ifExists);
        response.setDriverPhone(driverPhone);

        return Result.ok(response);
    }

    @ApiOperation("根据车牌号查询订单需要的司机信息")
    @GetMapping("/get-available-driver/{vehicleNo}")
    public Result getAvailableDriver(@PathVariable("vehicleNo") String vehicleNo){
        return driverUserService.getAvailableDriver(vehicleNo);
    }

    @ApiOperation("根据司机手机号查询司机和车辆绑定关系")
//    @GetMapping("/driver-car-binding-relationship/{driverPhone}")
    @GetMapping("/driver-car-binding-relationship")
    public Result<DriverCarBindingRelationship> getDriverCarRelationShip(){
//        return driverCarBindingRelationshipService.getDriverCarRelationShipByDriverPhone(driverPhone);
        return driverCarBindingRelationshipService.getDriverCarRelationShipByDriverPhone(UserContext.getUser().getPhone());
    }

    @ApiOperation("增加司机总单数")
    @GetMapping("/add-driver-total-orders/{driverId}")
    public Result addDriverTotalOrders(@PathVariable("driverId") Long driverId){
        return driverUserService.addDriverTotalOrders(driverId);
    }

}
