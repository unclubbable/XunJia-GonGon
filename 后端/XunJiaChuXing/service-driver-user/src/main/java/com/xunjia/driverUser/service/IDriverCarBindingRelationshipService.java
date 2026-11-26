package com.xunjia.driverUser.service;

import com.xunjia.api.dto.DriverCarBindingRelationship;
import com.baomidou.mybatisplus.extension.service.IService;
import com.xunjia.api.result.Result;


public interface IDriverCarBindingRelationshipService extends IService<DriverCarBindingRelationship> {

    Result bind(DriverCarBindingRelationship driverCarBindingRelationship);

    Result unbind(DriverCarBindingRelationship driverCarBindingRelationship);

    Result<DriverCarBindingRelationship> getDriverCarRelationShipByDriverPhone(String driverPhone);

    Result<DriverCarBindingRelationship> getBindingByDriverId(Long driverId);

    Result<DriverCarBindingRelationship> getBindingByCarId(Long carId);
}
