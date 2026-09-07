package com.taxi.driverUser.controller;

import com.taxi.api.result.Result;
import com.taxi.driverUser.service.ITicketHelperService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/driver-user/ticket-helper")
public class TicketHelperController {

    @Autowired
    private ITicketHelperService ticketHelperService;

    @ApiOperation("可切换运营城市（基于计价规则与当前绑定车型）")
    @GetMapping("/operable-cities")
    public Result listOperableCities() {
        return ticketHelperService.listOperableCities();
    }

    @ApiOperation("当前运营区域下可绑定/换绑的车辆")
    @GetMapping("/bindable-cars")
    public Result listBindableCars() {
        return ticketHelperService.listBindableCars();
    }
}
