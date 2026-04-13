package com.taxi.driverUser.service;

import com.taxi.api.dto.DriverCarBindingRelationship;
import com.baomidou.mybatisplus.extension.service.IService;
import com.taxi.api.result.Result;


public interface IDriverCarBindingRelationshipService extends IService<DriverCarBindingRelationship> {

    Result bind(DriverCarBindingRelationship driverCarBindingRelationship);

    Result unbind(DriverCarBindingRelationship driverCarBindingRelationship);

    Result<DriverCarBindingRelationship> getDriverCarRelationShipByDriverPhone(String driverPhone);
}
