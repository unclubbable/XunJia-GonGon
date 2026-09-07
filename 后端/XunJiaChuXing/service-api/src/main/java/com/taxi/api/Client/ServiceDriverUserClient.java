package com.taxi.api.Client;

import com.taxi.api.dto.Car;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.response.DriverUserExistsResponse;
import com.taxi.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import com.taxi.api.response.OrderDriverResponse;


/**
 * 司机用户服务 Feign 客户端，调用路径统一带 /driver-user 前缀
 */
@FeignClient("service-driver-user")
public interface ServiceDriverUserClient {
    @GetMapping("/driver-user/check-driver/{driverPhone}")
    public Result<DriverUserExistsResponse> getUser(@PathVariable("driverPhone") String driverPhone);

    @PostMapping("/driver-user/driver-user")
    public Result addOrUpdateDriverUser(@RequestBody DriverUser driverUser);

    @GetMapping("/driver-user/driver-user/list")
    public Result getDriverUserList(@RequestParam int page, @RequestParam int limit, @RequestParam(required = false) String address, @RequestParam(required = false) String phone,@RequestParam(required = false) String state);

    @PostMapping("/driver-user/car")
    public Result addCar(@RequestBody Car car);

    @GetMapping("/driver-user/car/list")
    public Result getCarList(@RequestParam int page, @RequestParam int limit, @RequestParam(required = false) String address, @RequestParam(required = false) String vehicleNo);

    @PostMapping("/driver-user/driver_car_binging_relationship/bind")
    public Result bind(@RequestBody DriverCarBindingRelationship driverCarBindingRelationship);

    @PostMapping("/driver-user/driver_car_binging_relationship/unbind")
    public Result unbind(@RequestBody DriverCarBindingRelationship driverCarBindingRelationship);

    @GetMapping("/driver-user/driver_car_binging_relationship/by-driver/{driverId}")
    public Result<DriverCarBindingRelationship> getBindingByDriverId(@PathVariable Long driverId);

    @GetMapping("/driver-user/driver_car_binging_relationship/by-car/{carId}")
    public Result<DriverCarBindingRelationship> getBindingByCarId(@PathVariable Long carId);

    @GetMapping("/driver-user/add-driver-total-orders/{driverId}")
    public Result addDriverTotalOrders(@PathVariable("driverId") Long driverId);

    @GetMapping("/driver-user/city-driver/is-alailable-driver/{cityCode}")
    public Result<Boolean> isAvailableDriver(@PathVariable String cityCode);

    @GetMapping("/driver-user/get-available-driver/{vehicleNo}")
    public Result<OrderDriverResponse> getAvailableDriver(@PathVariable("vehicleNo") String vehicleNo);

    @GetMapping("/driver-user/get-car/{cid}")
    public Result<Car> getCar(@PathVariable("cid") Long cid);

    @GetMapping("/driver-user/get-driver-info/{driverId}")
    public Result<DriverUser> getDriverInfo(@PathVariable("driverId") Long driverId);

    @GetMapping("/driver-user/get-car/{cid}")
    public Result<Car> getCarById(@PathVariable("cid") Long cid);

    @GetMapping("/driver-user/driver-user-money/{driverId}/{RecentlyMonth}")
    public Result getMoneyByDriverIdYearMonth(@PathVariable Long driverId,@PathVariable Integer RecentlyMonth);

    @PostMapping("/driver-user/driver-user-money/{driverId}")
    public Result addMoneyByDriverId(@PathVariable Long driverId,@RequestBody Double Money);

    @PostMapping("/driver-user/driver-user-money/{driverId}/deduct")
    Result deductMoneyByDriverId(@PathVariable Long driverId, @RequestBody Double money);

    @GetMapping("/driver-user/dict-car-class/all")
    public Result getDictCarClassAll();

}
