package com.taxi.driverUser.service;

import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.exception.BusinessException;
import com.taxi.api.response.DriverUserExistsResponse;
import com.taxi.api.response.TokenResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.util.FeignResultUtils;
import com.taxi.common.constant.DriverCarConstants;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.TokenConstants;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
import com.taxi.common.util.SmsVerifyCodeSender;
import com.taxi.common.util.VerificationCodeUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import java.util.concurrent.TimeUnit;


@Slf4j
@Service
public class VerificationCodeService {
    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @Autowired
    private SmsVerifyCodeSender smsVerifyCodeSender;

    public Result checkAndsendVerificationCode(String driverPhone) {
        DriverUserExistsResponse data = FeignResultUtils.checkAndGet(
                serviceDriverUserClient.getUser(driverPhone), ResultCodeEnum.DRIVER_NOT_EXITST);
        int ifExists = data.getIfExists();
        if (ifExists != DriverCarConstants.DRIVER_EXISTS) {
            return Result.fail(ResultCodeEnum.DRIVER_NOT_EXITST);
        }

        int code = VerificationCodeUtils.generateNumberCode(6);
        Integer verificationTime = 5;

        String key = RedisPrefixUtils.generatorDriverKeyByPhone(driverPhone, IdentityConstant.DRIVER_IDENTITY);
        redisTemplate.opsForValue().set(key, code + "", verificationTime, TimeUnit.MINUTES);

        try {
            smsVerifyCodeSender.send(driverPhone, String.valueOf(code), String.valueOf(verificationTime));
        } catch (Exception e) {
            log.error("发送验证码异常：{}", e.getMessage());
            throw new BusinessException(ResultCodeEnum.INTERNAL_ERROR, "验证码发送失败，请稍后重试");
        }
        log.info("司机验证码: phone={}, code={}", driverPhone, code);
        return Result.ok();
    }

    public Result checkCode(String driverPhone, String verificationCode) {
        if (ObjectUtils.isEmpty(driverPhone) || ObjectUtils.isEmpty(verificationCode)) {
            return Result.fail(ResultCodeEnum.VERIFICATION_CODE_ERROR);
        }

        String key = RedisPrefixUtils.generatorDriverKeyByPhone(driverPhone, IdentityConstant.DRIVER_IDENTITY);
        String codeRedis = redisTemplate.opsForValue().get(key);

        if (StringUtils.isEmpty(codeRedis) || !verificationCode.trim().equals(codeRedis.trim())) {
            return Result.fail(ResultCodeEnum.CHECK_CODE_ERROR);
        }

        String accessToken = JwtUtils.generatorToken(driverPhone, IdentityConstant.DRIVER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        String refreshToken = JwtUtils.generatorToken(driverPhone, IdentityConstant.DRIVER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);

        String accessTokenKey = RedisPrefixUtils.generatorTokenKey(driverPhone, IdentityConstant.DRIVER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        redisTemplate.opsForValue().set(accessTokenKey, accessToken, 30, TimeUnit.DAYS);

        String refreshTokenKey = RedisPrefixUtils.generatorTokenKey(driverPhone, IdentityConstant.DRIVER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);
        redisTemplate.opsForValue().set(refreshTokenKey, refreshToken, 31, TimeUnit.DAYS);

        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setAccessToken(accessToken);
        tokenResponse.setRefreshToken(refreshToken);
        return Result.ok(tokenResponse);
    }
}
