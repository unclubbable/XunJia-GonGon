package com.taxi.driverUser.service;

import com.taxi.api.dto.DriverUserWorkStatus;
import com.baomidou.mybatisplus.extension.service.IService;
import com.taxi.api.result.Result;


public interface IDriverUserWorkStatusService extends IService<DriverUserWorkStatus> {

    Result changeWorkStatus(Long driverId, Integer workStatus, String address);

    Result<DriverUserWorkStatus> getWorkStatus(Long driverId);

    Result getAllWorkStatus();

    Result changeWorkStatusBoss(Long driverId, Integer workStatus);
}
