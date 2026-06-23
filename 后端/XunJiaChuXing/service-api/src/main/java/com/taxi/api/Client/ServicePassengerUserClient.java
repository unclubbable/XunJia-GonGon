package com.taxi.api.Client;

import com.taxi.api.dto.PassengerUser;
import com.taxi.api.request.VerificationCodeDTO;
import com.taxi.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient("service-passenger-user")
public interface ServicePassengerUserClient {
    @GetMapping("/passenger-user/list")
    public Result getUserList(@RequestParam int page, @RequestParam int limit, @RequestParam(required = false) String passengerPhone);

    @GetMapping("/passenger-user/get-passenger-info/{passengerId}")
    public Result<PassengerUser> getPassengerInfo(@PathVariable("passengerId") Long passengerId);


    @PostMapping("/passenger-user")
    public Result loginOrReg(@RequestBody VerificationCodeDTO verificationCodeDTO);

    @GetMapping("/passenger-user/{phone}")
    public Result<PassengerUser> getUserByPhone(@PathVariable("phone")String phone);
}