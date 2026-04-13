package com.taxi.driverUser.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.taxi.common.constant.DriverCarConstants;
import com.taxi.api.dto.Car;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.dto.DriverUserWorkStatus;
import com.taxi.driverUser.mapper.CarMapper;
import com.taxi.driverUser.mapper.DriverCarBindingRelationshipMapper;
import com.taxi.driverUser.mapper.DriverUserMapper;
import com.taxi.driverUser.mapper.DriverUserWorkStatusMapper;
import com.taxi.api.response.OrderDriverResponse;
import com.taxi.api.result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class DriverUserService {
    @Autowired
    private DriverUserMapper driverUserMapper;
    @Autowired
    private DriverUserWorkStatusMapper driverUserWorkStatusMapper;

    @Autowired
    private CarMapper carMapper;

    public Result getDriverUserList(int page,int limit, String address, String phone,String state){
        Page<DriverUser> pageObj = new Page<>(page, limit);

        // 创建LambdaQueryWrapper
        LambdaQueryWrapper<DriverUser> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(DriverUser::getState,0);
        // 如果address不为空，添加到查询条件
        if (StringUtils.isNotEmpty(address)) {
            queryWrapper.eq(DriverUser::getAddress, address);
        }
        // 如果phone不为空，添加到查询条件
        if (StringUtils.isNotEmpty(phone)) {
            queryWrapper.like(DriverUser::getDriverPhone, phone);
        }
        // 如果status不为空，添加到查询条件
        if (StringUtils.isNotEmpty(state)) {
            queryWrapper.eq(DriverUser::getState, state);
        }

        IPage<DriverUser> iPage = driverUserMapper.selectPage(pageObj, queryWrapper);
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    @Transactional
    public Result addDriverUser(DriverUser driverUser) {
        DriverUser mysqlUser = driverUserMapper.selectById(driverUser.getId());
        if (ObjectUtils.isEmpty(mysqlUser)) {
            driverUserMapper.insert(driverUser);

            //初始化 司机工作状态表
            DriverUserWorkStatus driverUserWorkStatus = new DriverUserWorkStatus();
            driverUserWorkStatus.setDriverId(driverUser.getId());
            driverUserWorkStatus.setWorkStatus(DriverCarConstants.DRIVER_WORK_STATUS_STOP);
            driverUserWorkStatusMapper.insert(driverUserWorkStatus);
        } else {
            driverUserMapper.updateById(driverUser);
        }
        return Result.ok();
    }

    public DriverUser getDriverByPhone(String driverPhone) {
        Map<String, Object> map = new HashMap<>();
        map.put("driver_phone", driverPhone);
        map.put("state", DriverCarConstants.DRIVER_STATE_VALID);
        List<DriverUser> driverUsers = driverUserMapper.selectByMap(map);
        if (driverUsers.isEmpty()) {
            return null;
        }
        DriverUser driverUser = driverUsers.get(0);

        return driverUser;
    }

    @Autowired
    private DriverCarBindingRelationshipMapper driverCarBindingRelationshipMapper;

    public Result getAvailableDriver(String vehicleNo) {
        OrderDriverResponse orderDriverResponse = new OrderDriverResponse();

        //根据车牌号查询订单需要的司机信息
        QueryWrapper<DriverCarBindingRelationship> driverCarBindingRelationshipQueryWrapper = new QueryWrapper<>();
        driverCarBindingRelationshipQueryWrapper.eq("vehicle_no", vehicleNo);
        driverCarBindingRelationshipQueryWrapper.eq("bind_state", DriverCarConstants.DRIVER_CAR_BIND);
        DriverCarBindingRelationship driverCarBindingRelationship = driverCarBindingRelationshipMapper.selectOne(driverCarBindingRelationshipQueryWrapper);
        //获取司机编号
        Long driverId = driverCarBindingRelationship.getDriverId();

        //根据司机编号查询该司机工作状态
        QueryWrapper<DriverUserWorkStatus> wrapperUserWork = new QueryWrapper<>();
        wrapperUserWork.eq("driver_id", driverId);
        wrapperUserWork.eq("work_status", DriverCarConstants.DRIVER_WORK_STATUS_START);
        DriverUserWorkStatus driverUserWorkStatus = driverUserWorkStatusMapper.selectOne(wrapperUserWork);
        if (ObjectUtils.isEmpty(driverUserWorkStatus)) {
            return Result.fail().message("该司机未出车");
        }

        //获取车辆信息
        QueryWrapper<Car> carQueryWrapper = new QueryWrapper<>();
        carQueryWrapper.eq("vehicle_no", vehicleNo);
        carQueryWrapper.eq("state", 0);
        Car car = carMapper.selectOne(carQueryWrapper);
        if (!ObjectUtils.isEmpty(car)) {
            orderDriverResponse.setCarId(car.getId());
            orderDriverResponse.setVehicleNo(car.getVehicleNo());
            orderDriverResponse.setVehicleType(car.getVehicleType());
        }

        //根据司机编号查询司机信息，获取司机手机号,然后封装返回
        QueryWrapper<DriverUser> driverUserQueryWrapper = new QueryWrapper<>();
        driverUserQueryWrapper.eq("id", driverId);
        DriverUser driverUser = driverUserMapper.selectOne(driverUserQueryWrapper);
        if (!ObjectUtils.isEmpty(driverUser)) {
            orderDriverResponse.setDriverPhone(driverUser.getDriverPhone());
            orderDriverResponse.setLicenseId(driverUser.getLicenseId());
        }

        orderDriverResponse.setDriverId(driverId);

        return Result.ok(orderDriverResponse);
    }

    public Result<DriverUser> getDriverInfoById(Long driverId) {
        DriverUser driverUser = driverUserMapper.selectById(driverId);
        return Result.ok(driverUser);
    }

    public Result addDriverTotalOrders(Long driverId) {
        DriverUser driverUser = driverUserMapper.selectById(driverId);
        driverUser.setTotalOrders(driverUser.getTotalOrders() + 1);
        driverUserMapper.updateById(driverUser);
        return Result.ok();
    }
}
