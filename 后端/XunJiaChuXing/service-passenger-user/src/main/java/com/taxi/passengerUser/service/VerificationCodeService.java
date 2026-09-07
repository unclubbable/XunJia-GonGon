package com.taxi.passengerUser.service;

import com.taxi.api.Client.ServicePassengerUserClient;
import com.taxi.api.exception.BusinessException;
import com.taxi.api.request.VerificationCodeDTO;
import com.taxi.api.response.TokenResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
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

import java.util.concurrent.TimeUnit;


@Slf4j
@Service
public class VerificationCodeService {
    @Autowired
    private ServicePassengerUserClient servicePassengerUserClient;
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private SmsVerifyCodeSender smsVerifyCodeSender;

    public Result generatorCode(String passengerPhone) {
        int code = VerificationCodeUtils.generateNumberCode(6);

        String key = RedisPrefixUtils.generatorPassengerKeyByPhone(passengerPhone, IdentityConstant.PASSENGER_IDENTITY);
        Integer verificationTime = 5;
        stringRedisTemplate.opsForValue().set(key, code + "", verificationTime, TimeUnit.MINUTES);

        try {
            smsVerifyCodeSender.send(passengerPhone, String.valueOf(code), String.valueOf(verificationTime));
        } catch (Exception e) {
            log.error("发送验证码异常：{}", e.getMessage());
            throw new BusinessException(ResultCodeEnum.INTERNAL_ERROR, "验证码发送失败，请稍后重试");
        }
        log.info("乘客验证码: phone={}, code={}", passengerPhone, code);
        return Result.ok();
    }

    public Result checkCode(String passengerPhone, String verificationCode) {
        if (ObjectUtils.isEmpty(passengerPhone) || ObjectUtils.isEmpty(verificationCode)) {
            return Result.fail(ResultCodeEnum.VERIFICATION_CODE_ERROR);
        }

        String key = RedisPrefixUtils.generatorPassengerKeyByPhone(passengerPhone, IdentityConstant.PASSENGER_IDENTITY);
        String codeRedis = stringRedisTemplate.opsForValue().get(key);

        if (codeRedis == null || !verificationCode.equals(codeRedis)) {
            return Result.fail(ResultCodeEnum.CHECK_CODE_ERROR);
        }

        VerificationCodeDTO verificationCodeDTO = new VerificationCodeDTO();
        verificationCodeDTO.setPassengerPhone(passengerPhone);
        Result result = servicePassengerUserClient.loginOrReg(verificationCodeDTO);
        if (!result.isOk()) {
            return result;
        }

        String accessToken = JwtUtils.generatorToken(passengerPhone, IdentityConstant.PASSENGER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        String refreshToken = JwtUtils.generatorToken(passengerPhone, IdentityConstant.PASSENGER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);

        String accessTokenKey = RedisPrefixUtils.generatorTokenKey(passengerPhone, IdentityConstant.PASSENGER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        stringRedisTemplate.opsForValue().set(accessTokenKey, accessToken, 30, TimeUnit.DAYS);

        String refreshTokenKey = RedisPrefixUtils.generatorTokenKey(passengerPhone, IdentityConstant.PASSENGER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);
        stringRedisTemplate.opsForValue().set(refreshTokenKey, refreshToken, 31, TimeUnit.DAYS);

        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setAccessToken(accessToken);
        tokenResponse.setRefreshToken(refreshToken);
        result.setData(tokenResponse);
        return result;
    }
}
