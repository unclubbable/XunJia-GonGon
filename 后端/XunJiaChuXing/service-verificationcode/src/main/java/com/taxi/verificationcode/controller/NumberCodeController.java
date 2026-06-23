package com.taxi.verificationcode.controller;

import com.taxi.api.response.NumberCodeResponse;
import com.taxi.api.result.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;



@RestController
public class NumberCodeController {

    @GetMapping("/numberCode/{size}")
    public Result numberCode(@PathVariable("size")int size){
        //获取随机数
        int code = (int)((Math.random() * 9+1)*(Math.pow(10,size-1)));

        //定义返回值
        NumberCodeResponse response = new NumberCodeResponse();
        response.setNumberCode(code);
        return Result.ok(response);
    }
}
