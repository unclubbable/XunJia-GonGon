package com.xunjia.driverUser.service;

import com.xunjia.driverUser.mapper.DriverUserMapper;
import com.xunjia.api.result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class CityDriverUserService {

    @Autowired
    private DriverUserMapper driverUserMapper;

    public Result<Boolean> isAvailableDriver(String cityCode){
        Integer integer = driverUserMapper.selectDriverUserCountByCityCode(cityCode);
        if(integer>0){
            return Result.ok(true);
        }else {
            return Result.ok(false);
        }
    }
}
