package com.taxi.driverUser.service;

import com.taxi.api.result.Result;

public interface ITicketHelperService {

    /** 当前绑定车型可运营的城市（来自计价表） */
    Result listOperableCities();

    /** 当前运营区域下可绑定/换绑的车辆 */
    Result listBindableCars();
}
