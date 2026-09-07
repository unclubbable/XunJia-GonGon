package com.taxi.passengerUser.controller;

import com.taxi.api.request.VerificationCodeDTO;
import com.taxi.api.result.Result;
import com.taxi.api.validation.ValidationGroups;
import com.taxi.passengerUser.service.VerificationCodeService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;


@RestController
public class VerificationCodeController {
    @Autowired
    private VerificationCodeService verificationCodeService;

    //获取验证码
    @ApiOperation("获取验证码")
    @PostMapping("/verification-code")
    public Result verificationCode(@Validated(ValidationGroups.PassengerSend.class) @RequestBody VerificationCodeDTO verificationCodeDTO){
        String passengerPhone = verificationCodeDTO.getPassengerPhone();
        return verificationCodeService.generatorCode(passengerPhone);
    }

    //校验验证码
    @ApiOperation("校验验证码---需要填手机及验证码")
    @PostMapping("/verification-code-check")
    public Result checkVerificationCode(@Validated(ValidationGroups.PassengerCheck.class) @RequestBody VerificationCodeDTO verificationCodeDTO){
        String passengerPhone = verificationCodeDTO.getPassengerPhone();
        String verificationCode = verificationCodeDTO.getVerificationCode();
        return verificationCodeService.checkCode(passengerPhone, verificationCode);
    }
}
