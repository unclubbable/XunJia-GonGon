package com.taxi.driverUser.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.taxi.api.dto.Car;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.driverUser.mapper.CarMapper;
import com.taxi.api.Client.ServiceMapClient;
import com.taxi.api.response.TerminalResponse;
import com.taxi.api.response.TrackResponse;
import com.taxi.api.result.Result;
import com.taxi.driverUser.mapper.DriverCarBindingRelationshipMapper;
import com.taxi.driverUser.service.ICarService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class CarServiceImpl extends ServiceImpl<CarMapper, Car> implements ICarService {
    @Autowired
    private ServiceMapClient serviceMapClient;
    @Autowired
    private CarMapper carMapper;
    @Autowired
    private DriverCarBindingRelationshipMapper driverCarBindingRelationshipMapper;
    @Override
    public Result getCar(Long cid) {
        Car car = baseMapper.selectById(cid);
        return Result.ok(car);
    }

    @Override
    public Result addCar(Car car) {
        Long carId = car.getId();
        // 判断是update还是insert
        if( carId != null){  // update
            Car mysqlCar = baseMapper.selectById(carId);
            boolean empty = ObjectUtils.isEmpty(mysqlCar);
            if(empty){
                return Result.fail("无该车辆，无法更新");
            }
            baseMapper.updateById(car);
        }else{  // insert
            // 获取车辆终端tid
            TerminalResponse result = serviceMapClient.addTerminal(car.getVehicleNo(), car.getVehicleNo()).getData();
            String tid = result.getTid();
            car.setTid(tid);

            //获取车辆轨迹id
            TrackResponse data = serviceMapClient.addTrack(tid).getData();
            car.setTrid(data.getTrid());
            car.setTrname(data.getTrname());
            baseMapper.insert(car);
        }
        return Result.ok();
    }

    public Result getCarList(int page,int limit, String address, String vehicleNo){
        Page<Car> pageObj = new Page<>(page, limit);

        // 创建LambdaQueryWrapper
        LambdaQueryWrapper<Car> queryWrapper = new LambdaQueryWrapper<>();
        // 如果address不为空，添加到查询条件
        if (StringUtils.isNotEmpty(address)) {
            queryWrapper.eq(Car::getAddress, address);
        }
        // 如果vehicleNo不为空，添加到查询条件
        if (StringUtils.isNotEmpty(vehicleNo)) {
            queryWrapper.eq(Car::getVehicleNo,vehicleNo);
        }

        IPage<Car> iPage = carMapper.selectPage(pageObj, queryWrapper);
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    @Override
    public Result removeByCid(Long cid) {
        // 查找绑定记录
        Long l = driverCarBindingRelationshipMapper.selectCount(
                new QueryWrapper<DriverCarBindingRelationship>()
                        .eq("car_id", cid)
        );
        // 如果没有绑定记录，则删除车辆
        if (l == 0) {
            // 删除终端
            Car car = baseMapper.selectById(cid);
            serviceMapClient.deleteTerminal(car.getTid());
            // 删除车辆
            baseMapper.deleteById(cid);
        }
        else {
            return Result.fail().setMessage("该车辆有绑定记录，请先解除绑定");
        }
        return Result.ok();
    }

}
