package com.xunjia.driverUser.service;

import com.xunjia.api.dto.DriverUserWorkStatus;
import com.baomidou.mybatisplus.extension.service.IService;
import com.xunjia.api.result.Result;


public interface IDriverUserWorkStatusService extends IService<DriverUserWorkStatus> {

    Result changeWorkStatus(Long driverId, Integer workStatus, String address);

    Result<DriverUserWorkStatus> getWorkStatus(Long driverId);

    Result getAllWorkStatus();

    Result changeWorkStatusBoss(Long driverId, Integer workStatus);
}
