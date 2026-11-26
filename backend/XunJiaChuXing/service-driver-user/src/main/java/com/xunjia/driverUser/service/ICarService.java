package com.xunjia.driverUser.service;

import com.xunjia.api.dto.Car;
import com.baomidou.mybatisplus.extension.service.IService;
import com.xunjia.api.result.Result;


public interface ICarService extends IService<Car> {

    Result getCar(Long cid);

    Result addCar(Car car);

    Result getCarList(int page,int limit, String address, String vehicleNo);

    Result removeByCid(Long cid);
}
