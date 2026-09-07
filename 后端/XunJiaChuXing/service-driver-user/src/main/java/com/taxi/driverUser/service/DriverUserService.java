package com.taxi.driverUser.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.taxi.api.result.ResultCodeEnum;
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

        LambdaQueryWrapper<DriverUser> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(DriverUser::getState,0);
        if (StringUtils.isNotEmpty(address)) {
            queryWrapper.eq(DriverUser::getAddress, address);
        }
        if (StringUtils.isNotEmpty(phone)) {
            queryWrapper.like(DriverUser::getDriverPhone, phone);
        }
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
        if (driverUser == null || StringUtils.isBlank(driverUser.getDriverPhone())) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机手机号不能为空");
        }
        DriverUser mysqlUser = driverUserMapper.selectById(driverUser.getId());
        if (ObjectUtils.isEmpty(mysqlUser)) {
            driverUserMapper.insert(driverUser);

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
        return driverUsers.get(0);
    }

    @Autowired
    private DriverCarBindingRelationshipMapper driverCarBindingRelationshipMapper;

    public Result getAvailableDriver(String vehicleNo) {
        if (StringUtils.isBlank(vehicleNo)) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "车牌号不能为空");
        }
        OrderDriverResponse orderDriverResponse = new OrderDriverResponse();

        QueryWrapper<DriverCarBindingRelationship> driverCarBindingRelationshipQueryWrapper = new QueryWrapper<>();
        driverCarBindingRelationshipQueryWrapper.eq("vehicle_no", vehicleNo);
        driverCarBindingRelationshipQueryWrapper.eq("bind_state", DriverCarConstants.DRIVER_CAR_BIND);
        DriverCarBindingRelationship driverCarBindingRelationship = driverCarBindingRelationshipMapper.selectOne(driverCarBindingRelationshipQueryWrapper);
        if (ObjectUtils.isEmpty(driverCarBindingRelationship)) {
            return Result.fail(ResultCodeEnum.DRIVER_CAR_NOT_BOUND);
        }
        Long driverId = driverCarBindingRelationship.getDriverId();

        QueryWrapper<DriverUserWorkStatus> wrapperUserWork = new QueryWrapper<>();
        wrapperUserWork.eq("driver_id", driverId);
        wrapperUserWork.eq("work_status", DriverCarConstants.DRIVER_WORK_STATUS_START);
        DriverUserWorkStatus driverUserWorkStatus = driverUserWorkStatusMapper.selectOne(wrapperUserWork);
        if (ObjectUtils.isEmpty(driverUserWorkStatus)) {
            return Result.fail(ResultCodeEnum.DRIVER_NOT_WORKING);
        }

        QueryWrapper<Car> carQueryWrapper = new QueryWrapper<>();
        carQueryWrapper.eq("vehicle_no", vehicleNo);
        carQueryWrapper.eq("state", 0);
        Car car = carMapper.selectOne(carQueryWrapper);
        if (!ObjectUtils.isEmpty(car)) {
            orderDriverResponse.setCarId(car.getId());
            orderDriverResponse.setVehicleNo(car.getVehicleNo());
            orderDriverResponse.setVehicleType(car.getVehicleType());
        }

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
        if (driverId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID不能为空");
        }
        DriverUser driverUser = driverUserMapper.selectById(driverId);
        if (driverUser == null) {
            return Result.fail(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        return Result.ok(driverUser);
    }

    public Result addDriverTotalOrders(Long driverId) {
        if (driverId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID不能为空");
        }
        DriverUser driverUser = driverUserMapper.selectById(driverId);
        if (driverUser == null) {
            return Result.fail(ResultCodeEnum.DRIVER_NOT_EXITST);
        }
        driverUser.setTotalOrders(driverUser.getTotalOrders() + 1);
        driverUserMapper.updateById(driverUser);
        return Result.ok();
    }
}
