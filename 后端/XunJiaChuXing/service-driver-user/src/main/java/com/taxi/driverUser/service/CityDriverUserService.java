package com.taxi.driverUser.service;

import com.taxi.driverUser.mapper.DriverUserMapper;
import com.taxi.api.result.Result;
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
