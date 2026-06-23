package com.taxi.verificationcode.controller;

import com.taxi.api.result.Result;
import com.taxi.verificationcode.utils.Sample;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SMSTextConfig {
    @Autowired
    private Sample sample;
    @ApiOperation("发送短信(测试用)")
    @GetMapping("/sms/{phone}/{code}/{min}")
    public Result sms(@PathVariable String phone,@PathVariable String code,@PathVariable String min){
        try {
            sample.push(phone,code,min);
        } catch (Exception e) {
            return Result.fail(e);
        }
        return Result.ok();
    }
}
