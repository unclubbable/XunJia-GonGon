package com.xunjia.passengerUser.controller;

import com.xunjia.api.response.TokenResponse;
import com.xunjia.api.result.Result;
import com.xunjia.passengerUser.service.TokenService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class TokenController {

    @Autowired
    private TokenService tokenService;

    //刷新token
    @ApiOperation("刷新token")
    @PostMapping("/token-refresh")
    public Result refreshToken(@RequestBody TokenResponse tokenResponse){
        return tokenService.refreshToken(tokenResponse.getRefreshToken());
    }
}
