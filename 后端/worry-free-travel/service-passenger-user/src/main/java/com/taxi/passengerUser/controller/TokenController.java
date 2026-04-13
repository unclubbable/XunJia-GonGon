package com.taxi.passengerUser.controller;

import com.taxi.api.response.TokenResponse;
import com.taxi.api.result.Result;
import com.taxi.passengerUser.service.TokenService;
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
