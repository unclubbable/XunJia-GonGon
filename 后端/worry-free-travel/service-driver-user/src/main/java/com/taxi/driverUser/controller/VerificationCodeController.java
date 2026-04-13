package com.taxi.driverUser.controller;

import com.taxi.api.request.VerificationCodeDTO;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.VerificationCodeService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
public class VerificationCodeController {
    @Autowired
    private VerificationCodeService verificationCodeService;

    @ApiOperation("获取验证码")
    @PostMapping("/verification-code")
    public Result verificationCode(@RequestBody VerificationCodeDTO verificationCodeDTO){
        String driverPhone = verificationCodeDTO.getDriverPhone();
        return verificationCodeService.checkAndsendVerificationCode(driverPhone);
    }

    //校验验证码
    @ApiOperation("校验验证码")
    @PostMapping("/verification-code-check")
    public Result checkVerificationCode(@RequestBody VerificationCodeDTO verificationCodeDTO){
        String driverPhone = verificationCodeDTO.getDriverPhone();
        String verificationCode = verificationCodeDTO.getVerificationCode();
        System.out.println("手机号"+driverPhone+",验证码："+verificationCode);
        return verificationCodeService.checkCode(driverPhone, verificationCode);
    }
}
