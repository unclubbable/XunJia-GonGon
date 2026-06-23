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
        driverCarBindingRelationship.setBindState(DriverCarConstants.DRIVER_CAR_BIND);
        //判断:如果参数中的车辆和司机 已经绑定过 则不允许再次绑定
        QueryWrapper<DriverCarBindingRelationship> wrapper = new QueryWrapper<>();
        wrapper.eq("driver_id",driverCarBindingRelationship.getDriverId());
        wrapper.eq("car_id",driverCarBindingRelationship.getCarId());
        wrapper.eq("bind_state",DriverCarConstants.DRIVER_CAR_BIND);
        Long aLong = baseMapper.selectCount(wrapper);
        if(aLong.intValue()>0){
            //该司机与车重复绑定
            return Result.fail("司机与车重复绑定");
        }
        wrapper.clear();

        //判读：司机是否已经绑定车辆了
        wrapper.eq("driver_id",driverCarBindingRelationship.getDriverId());
        wrapper.eq("bind_state",driverCarBindingRelationship.getBindState());
        aLong = baseMapper.selectCount(wrapper);
        if(aLong.intValue()>0){
            return Result.fail("该司机早已绑定过车辆");
        }
        wrapper.clear();

        //判端：车辆是否被绑定了
        wrapper.eq("bind_state",driverCarBindingRelationship.getBindState());
        wrapper.eq("car_id",driverCarBindingRelationship.getCarId());
        aLong = baseMapper.selectCount(wrapper);
        if(aLong.intValue()>0){
            return Result.fail("该车辆早已被绑定");
        }
        wrapper.clear();

        //开始绑定
        LocalDateTime now=LocalDateTime.now();
        driverCarBindingRelationship.setBindingTime(now);
        //顺带绑定车牌号
        Car car = carMapper.selectOne(new QueryWrapper<Car>().eq("id", driverCarBindingRelationship.getCarId()));
        driverCarBindingRelationship.setVehicleNo(car.getVehicleNo());
        baseMapper.insert(driverCarBindingRelationship);
        return Result.ok();
    }

    @Override
    public Result unbind(DriverCarBindingRelationship driverCarBindingRelationship) {
        //判断：参数中的车辆和司机 是否是绑定状态
        QueryWrapper<DriverCarBindingRelationship> wrapper = new QueryWrapper<>();
        wrapper.eq("driver_id",driverCarBindingRelationship.getDriverId());
        wrapper.eq("car_id",driverCarBindingRelationship.getCarId());
        wrapper.eq("bind_state",DriverCarConstants.DRIVER_CAR_BIND);
        DriverCarBindingRelationship carBindingRelationship = baseMapper.selectOne(wrapper);
        if (ObjectUtils.isEmpty(carBindingRelationship)) {
            return Result.fail("绑定关系不存在");
        }
        //解绑
        carBindingRelationship.setBindState(DriverCarConstants.DRIVER_CAR_UNBIND);
        baseMapper.updateById(carBindingRelationship);
        return Result.ok("解绑成功");
    }

    public Result<DriverCarBindingRelationship> getDriverCarRelationShipByDriverPhone(String driverPhone){
        QueryWrapper<DriverUser> wrapper = new QueryWrapper<>();
        wrapper.eq("driver_phone",driverPhone);
        DriverUser driverUser = driverUserMapper.selectOne(wrapper);
        Long driverId = driverUser.getId();

        QueryWrapper<DriverCarBindingRelationship> bindingRelationshipQueryWrapper = new QueryWrapper<>();
        bindingRelationshipQueryWrapper.eq("driver_id",driverId);
        bindingRelationshipQueryWrapper.eq("bind_state",DriverCarConstants.DRIVER_CAR_BIND);
        DriverCarBindingRelationship driverCarBindingRelationship = baseMapper.selectOne(bindingRelationshipQueryWrapper);
        return Result.ok(driverCarBindingRelationship);
    }
}
