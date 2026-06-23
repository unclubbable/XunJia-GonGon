package com.taxi.driverUser.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.dto.DriverUserWorkStatus;
import com.taxi.driverUser.mapper.DriverUserMapper;
import com.taxi.driverUser.mapper.DriverUserWorkStatusMapper;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.IDriverUserWorkStatusService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class DriverUserWorkStatusServiceImpl extends ServiceImpl<DriverUserWorkStatusMapper, DriverUserWorkStatus> implements IDriverUserWorkStatusService {
    @Autowired
    private DriverUserWorkStatusMapper driverUserWorkStatusMapper;
    @Autowired
    private DriverUserMapper driverUserMapper;

    @Override
    public Result changeWorkStatus(Long driverId, Integer workStatus, String citycode) {
        Map<String, Object> map = new HashMap<>();
        map.put("driver_id",driverId);
        //判断数据是否存在
        List<DriverUserWorkStatus> driverUserWorkStatuses = baseMapper.selectByMap(map);
        //数据不存在
        if(driverUserWorkStatuses.size()==0){
            //插入
            DriverUserWorkStatus driverUserWorkStatus = new DriverUserWorkStatus();
            driverUserWorkStatus.setDriverId(driverId);
            driverUserWorkStatus.setWorkStatus(workStatus);
            driverUserWorkStatus.setCitycode(citycode);
            driverUserWorkStatusMapper.insert(driverUserWorkStatus);
            return Result.ok();
        }
        //数据存在
        DriverUserWorkStatus driverUserWorkStatus = driverUserWorkStatuses.get(0);
        //判断城市是否一致（如果为空则填充）
        if (driverUserWorkStatus.getCitycode()== null){
            driverUserWorkStatus.setCitycode(citycode);
        }
        else if (!driverUserWorkStatus.getCitycode().equals(citycode)){
            return Result.fail().message("城市不一致");
        }

        driverUserWorkStatus.setWorkStatus(workStatus);
        driverUserWorkStatusMapper.updateById(driverUserWorkStatus);
        return Result.ok();
    }

    @Override
    public Result<DriverUserWorkStatus> getWorkStatus(Long driverId) {
        Map<String,Object> queryMap = new HashMap<>();
        queryMap.put("driver_id",driverId);
        List<DriverUserWorkStatus> driverUserWorkStatuses = driverUserWorkStatusMapper.selectByMap(queryMap);
        DriverUserWorkStatus driverUserWorkStatus = driverUserWorkStatuses.get(0);
        return Result.ok(driverUserWorkStatus);
    }

    @Override
    public Result changeWorkCity(Long driverId, String adname, String citycode, String adcode) {
        //修改工作表（String adname, String citycode）
        DriverUserWorkStatus driverUserWorkStatus = driverUserWorkStatusMapper.selectById(driverId);
        driverUserWorkStatus.setAdname(adname);
        driverUserWorkStatus.setAdcode(adcode);
        driverUserWorkStatus.setCitycode(citycode);
        driverUserWorkStatusMapper.updateById(driverUserWorkStatus);
        //修改用户表（String adcode）
        DriverUser driverUser = driverUserMapper.selectById(driverId);
        driverUser.setAddress(adcode);
        driverUserMapper.updateById(driverUser);
        return Result.ok();
    }

    @Override
    public Result getAllWorkStatus() {
        List<DriverUserWorkStatus> driverUserWorkStatuses = driverUserWorkStatusMapper.selectList(null);
        return Result.ok(driverUserWorkStatuses);
    }

    @Override
    public Result changeWorkStatusBoss(Long driverId, Integer workStatus) {
        DriverUserWorkStatus driverUserWorkStatus = driverUserWorkStatusMapper.selectById(driverId);
        if(driverUserWorkStatus==null){
            List<DriverUser> driverUsers = driverUserMapper.selectList(new QueryWrapper<DriverUser>().eq("id", driverId));
            DriverUserWorkStatus insertdriverUserWorkStatus = new DriverUserWorkStatus();
            insertdriverUserWorkStatus.setDriverId(driverId);
            insertdriverUserWorkStatus.setWorkStatus(workStatus);
            insertdriverUserWorkStatus.setAdcode(driverUsers.get(0).getAddress());
            driverUserWorkStatusMapper.insert(insertdriverUserWorkStatus);
        }
        else {
            driverUserWorkStatus.setWorkStatus(workStatus);
            driverUserWorkStatusMapper.updateById(driverUserWorkStatus);
        }
        return Result.ok();
    }
}
