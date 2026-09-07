package com.taxi.passengerUser.controller;

import com.taxi.api.dto.PassengerUser;
import com.taxi.api.request.VerificationCodeDTO;
import com.taxi.api.result.Result;
import com.taxi.common.util.Osspush;
import com.taxi.common.util.UserContext;
import com.taxi.passengerUser.service.UserService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RequestMapping("/passenger-user")
@RestController
public class UserController {
    @Autowired
    private UserService userService;

    @ApiOperation("用户登录或注册--是用户填用户手机，是司机填写司机手机（光填手机）")
    @PostMapping()
    public Result loginOrReg(@RequestBody VerificationCodeDTO verificationCodeDTO){
        String passengerPhone = verificationCodeDTO.getPassengerPhone();
        return userService.loginOrResult(passengerPhone);
    }

    @ApiOperation("根据id查询乘客信息")
    @GetMapping("/get-passenger-info/{passengerId}")
    public Result<PassengerUser> getPassengerInfo(@PathVariable("passengerId") Long passengerId){
        return userService.getPassengerInfoById(passengerId);
    }
    @ApiOperation("根据token查询用户信息")
    @GetMapping()
    public Result<PassengerUser> getPassengerInfo(){
        return userService.getUserByPhone(UserContext.getUser().getPhone());
    }

    @ApiOperation("根据手机号查询用户信息")
    @GetMapping("/{phone}")
    public Result getUserByPhone(@PathVariable("phone")String phone){
        return userService.getUserByPhone(phone);
    }

    @ApiOperation("查询用户列表")
    @GetMapping("/list")
    public Result getUserList(@RequestParam int page,
                              @RequestParam int limit,
                              @RequestParam(required = false) String phone){
        return userService.getUserList(page,limit,phone);
    }
    @ApiOperation("更新用户")
    @PutMapping()
    public Result updateUser(@RequestBody PassengerUser passengerUser){
        return userService.updateUser(passengerUser);
    }
    @ApiOperation("上传用户头像")
    @PostMapping("/upload")
    public Result upload(@RequestParam("file") MultipartFile file){
        return userService.upload(file);
    }
}
