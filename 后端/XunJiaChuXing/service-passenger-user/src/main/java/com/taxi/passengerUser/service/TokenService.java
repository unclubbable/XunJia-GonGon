package com.taxi.passengerUser.service;

import com.taxi.common.constant.TokenConstants;
import com.taxi.common.ThreadLoad.TokenResult;
import com.taxi.api.response.TokenResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.concurrent.TimeUnit;


@Service
public class TokenService {
    @Autowired
    StringRedisTemplate redisTemplate;

    /**
     * 刷新双token,只有登录成功才会执行这个方法
     * @param refreshTokenSrc
     * @return
     */
    public Result refreshToken(String refreshTokenSrc){
        //解析refreshtoklen
        TokenResult tokenResult = JwtUtils.parseToken(refreshTokenSrc);
        if (ObjectUtils.isEmpty(tokenResult)) {
            return Result.fail().code(ResultCodeEnum.TOKEN_ERROR.getCode()).message(ResultCodeEnum.TOKEN_ERROR.getMessage());
        }
        String identity = tokenResult.getIdentity();
        String phone = tokenResult.getPhone();

        //去读取redis中的 refreshtoken
        String refreshTokenKey = RedisPrefixUtils.generatorTokenKey(phone, identity, TokenConstants.REFRESH_TOKEN_TYPE);
        String refreshTokenRedis = redisTemplate.opsForValue().get(refreshTokenKey);

        //校验refreshToken
        if (StringUtils.isBlank(refreshTokenRedis)||(!refreshTokenSrc.trim().equals(refreshTokenRedis.trim()))) {
            return Result.fail().code(ResultCodeEnum.TOKEN_ERROR.getCode()).message(ResultCodeEnum.TOKEN_ERROR.getMessage());
        }

        //生成双token
        String refreshToken = JwtUtils.generatorToken(phone, identity, TokenConstants.REFRESH_TOKEN_TYPE);
        String accessToken = JwtUtils.generatorToken(phone, identity, TokenConstants.ACCESS_TOKEN_TYPE);

        //生成第一个access的token键
        String accessTokenKey = RedisPrefixUtils.generatorTokenKey(phone, identity, TokenConstants.ACCESS_TOKEN_TYPE);

        redisTemplate.opsForValue().set(accessTokenKey,accessToken,30, TimeUnit.DAYS);
        redisTemplate.opsForValue().set(refreshTokenKey,refreshToken,31, TimeUnit.DAYS);

        //把两个token封装起来
        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setRefreshToken(refreshToken);
        tokenResponse.setAccessToken(accessToken);

        return Result.ok(tokenResponse);
    }
}
