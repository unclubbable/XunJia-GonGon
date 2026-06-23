package com.taxi.api.Client;

import com.taxi.api.dto.Car;
import com.taxi.api.dto.DriverCarBindingRelationship;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.response.DriverUserExistsResponse;
import com.taxi.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import com.taxi.api.response.OrderDriverResponse;


@FeignClient("service-driver-user")
public interface ServiceDriverUserClient {
    @GetMapping("/check-driver/{driverPhone}")
    public Result<DriverUserExistsResponse> getUser(@PathVariable("driverPhone") String driverPhone);

    @PostMapping("/driver-user")
    public Result addOrUpdateDriverUser(@RequestBody DriverUser driverUser);

    @GetMapping("/driver-user/list")
    public Result getDriverUserList(@RequestParam int page, @RequestParam int limit, @RequestParam(required = false) String address, @RequestParam(required = false) String phone,@RequestParam(required = false) String state);

    @PostMapping("/car")
    public Result addCar(@RequestBody Car car);

    @GetMapping("/car/list")
    public Result getCarList(@RequestParam int page, @RequestParam int limit, @RequestParam(required = false) String address, @RequestParam(required = false) String vehicleNo);

    @PostMapping("/bind")
    public Result bind(@RequestBody DriverCarBindingRelationship driverCarBindingRelationship);

    @PostMapping("/unbind")
    public Result unbind(@RequestBody DriverCarBindingRelationship driverCarBindingRelationship);

    @GetMapping("/add-driver-total-orders/{driverId}")
    public Result addDriverTotalOrders(@PathVariable("driverId") Long driverId);

    @GetMapping("/city-driver/is-alailable-driver/{cityCode}")
    public Result<Boolean> isAvailableDriver(@PathVariable String cityCode);

    @GetMapping("/get-available-driver/{vehicleNo}")
    public Result<OrderDriverResponse> getAvailableDriver(@PathVariable("vehicleNo") String vehicleNo);

    @GetMapping("/get-car/{cid}")
    public Result<Car> getCar(@PathVariable("cid") Long cid);

    @GetMapping("/get-driver-info/{driverId}")
    public Result<DriverUser> getDriverInfo(@PathVariable("driverId") Long driverId);

    @GetMapping("/get-car/{cid}")
    public Result<Car> getCarById(@PathVariable("cid") Long cid);

    @GetMapping("/driver-user-money/{driverId}/{RecentlyMonth}")
    public Result getMoneyByDriverIdYearMonth(@PathVariable Long driverId,@PathVariable Integer RecentlyMonth);

    @PostMapping("/driver-user-money/{driverId}")
    public Result addMoneyByDriverId(@PathVariable Long driverId,@RequestBody Double Money);

}