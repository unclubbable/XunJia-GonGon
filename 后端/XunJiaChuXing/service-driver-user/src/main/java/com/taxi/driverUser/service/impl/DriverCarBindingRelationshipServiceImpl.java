package com.taxi.driverUser.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.common.constant.DriverCarConstants;
import com.taxi.api.dto.Car;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.driverUser.mapper.CarMapper;
import com.taxi.driverUser.mapper.DriverCarBindingRelationshipMapper;
import com.taxi.driverUser.mapper.DriverUserMapper;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.driverUser.service.IDriverCarBindingRelationshipService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.time.LocalDateTime;


@Service
public class DriverCarBindingRelationshipServiceImpl extends ServiceImpl<DriverCarBindingRelationshipMapper, DriverCarBindingRelationship> implements IDriverCarBindingRelationshipService {
    @Autowired
    private CarMapper carMapper;

    @Autowired
    private DriverUserMapper driverUserMapper;

    @Override
    public Result bind(DriverCarBindingRelationship driverCarBindingRelationship) {
        if (driverCarBindingRelationship == null
                || driverCarBindingRelationship.getDriverId() == null
                || driverCarBindingRelationship.getCarId() == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID和车辆ID不能为空");
        }
        driverCarBindingRelationship.setBindState(DriverCarConstants.DRIVER_CAR_BIND);
        QueryWrapper<DriverCarBindingRelationship> wrapper = new QueryWrapper<>();
        wrapper.eq("driver_id",driverCarBindingRelationship.getDriverId());
        wrapper.eq("car_id",driverCarBindingRelationship.getCarId());
        wrapper.eq("bind_state",DriverCarConstants.DRIVER_CAR_BIND);
        Long aLong = baseMapper.selectCount(wrapper);
        if(aLong.intValue()>0){
            return Result.fail(ResultCodeEnum.DRIVER_CAR_BIND_EXISTS);
        }
        wrapper.clear();

        wrapper.eq("driver_id",driverCarBindingRelationship.getDriverId());
        wrapper.eq("bind_state",driverCarBindingRelationship.getBindState());
        aLong = baseMapper.selectCount(wrapper);
        if(aLong.intValue()>0){
            return Result.fail(ResultCodeEnum.DRIVER_BIND_EXISTS);
        }
        wrapper.clear();

        wrapper.eq("bind_state",driverCarBindingRelationship.getBindState());
        wrapper.eq("car_id",driverCarBindingRelationship.getCarId());
        aLong = baseMapper.selectCount(wrapper);
        if(aLong.intValue()>0){
            return Result.fail(ResultCodeEnum.CAR_BIND_EXISTS);
        }
        wrapper.clear();

        LocalDateTime now=LocalDateTime.now();
        driverCarBindingRelationship.setBindingTime(now);
        Car car = carMapper.selectOne(new QueryWrapper<Car>().eq("id", driverCarBindingRelationship.getCarId()));
        if (car == null) {
            return Result.fail(ResultCodeEnum.CAR_NOT_EXISTS);
        }
        driverCarBindingRelationship.setVehicleNo(car.getVehicleNo());
        baseMapper.insert(driverCarBindingRelationship);
        return Result.ok();
    }

    @Override
    public Result unbind(DriverCarBindingRelationship driverCarBindingRelationship) {
        if (driverCarBindingRelationship == null
                || driverCarBindingRelationship.getDriverId() == null
                || driverCarBindingRelationship.getCarId() == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID和车辆ID不能为空");
        }
        QueryWrapper<DriverCarBindingRelationship> wrapper = new QueryWrapper<>();
        wrapper.eq("driver_id",driverCarBindingRelationship.getDriverId());
        wrapper.eq("car_id",driverCarBindingRelationship.getCarId());
        wrapper.eq("bind_state",DriverCarConstants.DRIVER_CAR_BIND);
        DriverCarBindingRelationship carBindingRelationship = baseMapper.selectOne(wrapper);
        if (ObjectUtils.isEmpty(carBindingRelationship)) {
            return Result.fail(ResultCodeEnum.DRIVER_CAR_BIND_NOT_EXISTS);
        }
        carBindingRelationship.setBindState(DriverCarConstants.DRIVER_CAR_UNBIND);
        baseMapper.updateById(carBindingRelationship);
        return Result.ok("解绑成功");
    }

    public Result<DriverCarBindingRelationship> getDriverCarRelationShipByDriverPhone(String driverPhone){
        if (ObjectUtils.isEmpty(driverPhone)) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机手机号不能为空");
        }
        QueryWrapper<DriverUser> wrapper = new QueryWrapper<>();
        wrapper.eq("driver_phone",driverPhone);
        DriverUser driverUser = driverUserMapper.selectOne(wrapper);
        if (driverUser == null) {
            return Result.fail(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        Long driverId = driverUser.getId();

        QueryWrapper<DriverCarBindingRelationship> bindingRelationshipQueryWrapper = new QueryWrapper<>();
        bindingRelationshipQueryWrapper.eq("driver_id",driverId);
        bindingRelationshipQueryWrapper.eq("bind_state",DriverCarConstants.DRIVER_CAR_BIND);
        DriverCarBindingRelationship driverCarBindingRelationship = baseMapper.selectOne(bindingRelationshipQueryWrapper);
        return Result.ok(driverCarBindingRelationship);
    }

    @Override
    public Result<DriverCarBindingRelationship> getBindingByDriverId(Long driverId) {
        if (driverId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID不能为空");
        }
        QueryWrapper<DriverCarBindingRelationship> wrapper = new QueryWrapper<>();
        wrapper.eq("driver_id", driverId);
        wrapper.eq("bind_state", DriverCarConstants.DRIVER_CAR_BIND);
        return Result.ok(baseMapper.selectOne(wrapper));
    }

    @Override
    public Result<DriverCarBindingRelationship> getBindingByCarId(Long carId) {
        if (carId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "车辆ID不能为空");
        }
        QueryWrapper<DriverCarBindingRelationship> wrapper = new QueryWrapper<>();
        wrapper.eq("car_id", carId);
        wrapper.eq("bind_state", DriverCarConstants.DRIVER_CAR_BIND);
        return Result.ok(baseMapper.selectOne(wrapper));
    }
}
