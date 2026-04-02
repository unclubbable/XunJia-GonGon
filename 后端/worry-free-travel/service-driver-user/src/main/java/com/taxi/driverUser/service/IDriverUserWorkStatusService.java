package com.taxi.driverUser.service;

import com.taxi.api.dto.DriverUserWorkStatus;
import com.baomidou.mybatisplus.extension.service.IService;
import com.taxi.api.result.Result;


public interface IDriverUserWorkStatusService extends IService<DriverUserWorkStatus> {

    Result changeWorkStatus(Long driverId, Integer workStatus, String citycode);

    Result<DriverUserWorkStatus> getWorkStatus(Long driverId);

    Result changeWorkCity(Long driverId, String adname, String citycode, String adcode);

    Result getAllWorkStatus();

    Result changeWorkStatusBoss(Long driverId, Integer workStatus);
}
