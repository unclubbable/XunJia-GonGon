package com.taxi.driverUser.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.dto.DriverUserWorkStatus;
import com.taxi.common.constant.DriverCarConstants;
import com.taxi.driverUser.mapper.DriverCarBindingRelationshipMapper;
import com.taxi.driverUser.mapper.DriverUserMapper;
import com.taxi.driverUser.mapper.DriverUserWorkStatusMapper;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.driverUser.service.IDriverUserWorkStatusService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class DriverUserWorkStatusServiceImpl extends ServiceImpl<DriverUserWorkStatusMapper, DriverUserWorkStatus> implements IDriverUserWorkStatusService {
    @Autowired
    private DriverUserWorkStatusMapper driverUserWorkStatusMapper;
    @Autowired
    private DriverUserMapper driverUserMapper;
    @Autowired
    private DriverCarBindingRelationshipMapper driverCarBindingRelationshipMapper;

    @Override
    public Result changeWorkStatus(Long driverId, Integer workStatus, String address) {
        if (driverId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID不能为空");
        }
        if (workStatus != null && workStatus == DriverCarConstants.DRIVER_WORK_STATUS_START) {
            Result bindCheck = assertDriverBoundCar(driverId);
            if (bindCheck != null) {
                return bindCheck;
            }
            DriverUser driverUser = driverUserMapper.selectById(driverId);
            if (driverUser == null || !StringUtils.hasText(driverUser.getAddress())) {
                return Result.fail(ResultCodeEnum.DRIVER_CITY_NOT_SET);
            }
            if (!StringUtils.hasText(address) || !driverUser.getAddress().equals(address)) {
                return Result.fail(ResultCodeEnum.DRIVER_CITY_MISMATCH);
            }
        }

        Map<String, Object> map = new HashMap<>();
        map.put("driver_id", driverId);
        List<DriverUserWorkStatus> driverUserWorkStatuses = baseMapper.selectByMap(map);
        if (driverUserWorkStatuses == null || driverUserWorkStatuses.isEmpty()) {
            DriverUserWorkStatus driverUserWorkStatus = new DriverUserWorkStatus();
            driverUserWorkStatus.setDriverId(driverId);
            driverUserWorkStatus.setWorkStatus(workStatus);
            driverUserWorkStatusMapper.insert(driverUserWorkStatus);
            return Result.ok();
        }
        DriverUserWorkStatus driverUserWorkStatus = driverUserWorkStatuses.get(0);
        driverUserWorkStatus.setWorkStatus(workStatus);
        driverUserWorkStatusMapper.updateById(driverUserWorkStatus);
        return Result.ok();
    }

    @Override
    public Result<DriverUserWorkStatus> getWorkStatus(Long driverId) {
        if (driverId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID不能为空");
        }
        Map<String, Object> queryMap = new HashMap<>();
        queryMap.put("driver_id", driverId);
        List<DriverUserWorkStatus> driverUserWorkStatuses = driverUserWorkStatusMapper.selectByMap(queryMap);
        if (driverUserWorkStatuses == null || driverUserWorkStatuses.isEmpty()) {
            DriverUserWorkStatus empty = new DriverUserWorkStatus();
            empty.setDriverId(driverId);
            empty.setWorkStatus(0);
            return Result.ok(empty);
        }
        return Result.ok(driverUserWorkStatuses.get(0));
    }

    @Override
    public Result getAllWorkStatus() {
        List<DriverUserWorkStatus> driverUserWorkStatuses = driverUserWorkStatusMapper.selectList(null);
        return Result.ok(driverUserWorkStatuses);
    }

    @Override
    public Result changeWorkStatusBoss(Long driverId, Integer workStatus) {
        if (driverId == null) {
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "司机ID不能为空");
        }
        if (workStatus != null && workStatus == DriverCarConstants.DRIVER_WORK_STATUS_START) {
            Result bindCheck = assertDriverBoundCar(driverId);
            if (bindCheck != null) {
                return bindCheck;
            }
            DriverUser driverUser = driverUserMapper.selectById(driverId);
            if (driverUser == null) {
                return Result.fail(ResultCodeEnum.DRIVER_NOT_EXITST);
            }
            if (!StringUtils.hasText(driverUser.getAddress())) {
                return Result.fail(ResultCodeEnum.DRIVER_CITY_NOT_SET);
            }
        }
        Map<String, Object> queryMap = new HashMap<>();
        queryMap.put("driver_id", driverId);
        List<DriverUserWorkStatus> list = driverUserWorkStatusMapper.selectByMap(queryMap);
        if (list == null || list.isEmpty()) {
            DriverUserWorkStatus insertStatus = new DriverUserWorkStatus();
            insertStatus.setDriverId(driverId);
            insertStatus.setWorkStatus(workStatus);
            driverUserWorkStatusMapper.insert(insertStatus);
        } else {
            DriverUserWorkStatus driverUserWorkStatus = list.get(0);
            driverUserWorkStatus.setWorkStatus(workStatus);
            driverUserWorkStatusMapper.updateById(driverUserWorkStatus);
        }
        return Result.ok();
    }

    /**
     * 上线前校验：司机必须已绑定车辆。返回 null 表示通过。
     */
    private Result assertDriverBoundCar(Long driverId) {
        Long count = driverCarBindingRelationshipMapper.selectCount(
                new QueryWrapper<DriverCarBindingRelationship>()
                        .eq("driver_id", driverId)
                        .eq("bind_state", DriverCarConstants.DRIVER_CAR_BIND)
        );
        if (count == null || count <= 0) {
            return Result.fail(ResultCodeEnum.DRIVER_CAR_BIND_NOT_EXISTS, "司机未绑定车辆，无法上线");
        }
        return null;
    }
}
