package com.taxi.driverUser.service;

import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceVefificationcodeClient;
import com.taxi.common.constant.DriverCarConstants;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.TokenConstants;
import com.taxi.api.response.DriverUserExistsResponse;
import com.taxi.api.response.NumberCodeResponse;
import com.taxi.api.response.TokenResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
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
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;
    @Autowired
    ServiceVefificationcodeClient serviceVefificationcodeClient;
    @Autowired
    private StringRedisTemplate redisTemplate;

    public Result checkAndsendVerificationCode(String driverPhone) {
        //查询service-driver-user,该手机号的司机是否存在
        DriverUserExistsResponse data = serviceDriverUserClient.getUser(driverPhone).getData();
        int ifExists = data.getIfExists();
        if(ifExists!= DriverCarConstants.DRIVER_EXISTS){
            return Result.fail("司机不存在");
        }
        //获取验证码
        NumberCodeResponse num = serviceVefificationcodeClient.getNumberCode(6).getData();
        //设置验证码失效时间
        Integer verificationTime = 5;
        //调用短信服务发送验证码（RabbitMQ）
        try {
            rabbitTemplate.convertAndSend("verificationcode.push",null,driverPhone+"-"+verificationTime+"-"+num.getNumberCode());
        } catch (AmqpException e) {
            log.error("发送验证码异常：{}",e.getMessage());
            throw new RuntimeException(e);
        }
        System.out.println("验证码:" + num.getNumberCode());

        //存入redis
        String key = RedisPrefixUtils.generatorDriverKeyByPhone(driverPhone, IdentityConstant.DRIVER_IDENTITY);
        redisTemplate.opsForValue().set(key,num.getNumberCode()+"",verificationTime, TimeUnit.MINUTES);
        return Result.ok(num.getNumberCode());
    }

    public Result checkCode(String driverPhone,String verificationCode){
        if(ObjectUtils.isEmpty(driverPhone)||ObjectUtils.isEmpty(verificationCode)){
            ResultCodeEnum anEnum = ResultCodeEnum.VERIFICATION_CODE_ERROR;
            return Result.build(anEnum.getCode(), anEnum.getMessage());
        }

        //根据手机号,去redis读取验证码
        String key=RedisPrefixUtils.generatorDriverKeyByPhone(driverPhone,IdentityConstant.DRIVER_IDENTITY);
        String codeRedis = redisTemplate.opsForValue().get(key);

        //校验验证码
        if (!verificationCode.trim().equals(codeRedis.trim())||StringUtils.isEmpty(codeRedis)) {
            ResultCodeEnum anEnum = ResultCodeEnum.CHECK_CODE_ERROR;
            return Result.build(anEnum.getCode(),anEnum.getMessage());
        }

        //颁发令牌,不应该用魔法值,用常量
        String accessToken = JwtUtils.generatorToken(driverPhone, IdentityConstant.DRIVER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        String refreshToken=JwtUtils.generatorToken(driverPhone,IdentityConstant.DRIVER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);

        //将token存到redis当中
        String accessTokenKey = RedisPrefixUtils.generatorTokenKey(driverPhone, IdentityConstant.DRIVER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        redisTemplate.opsForValue().set(accessTokenKey,accessToken,30,TimeUnit.DAYS);//过期时间30天

        String refreshTokenKey = RedisPrefixUtils.generatorTokenKey(driverPhone, IdentityConstant.DRIVER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);
        redisTemplate.opsForValue().set(refreshTokenKey,refreshToken,31,TimeUnit.DAYS);//过期时间31天

        //响应
        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setAccessToken(accessToken);
        tokenResponse.setRefreshToken(refreshToken);
        return Result.ok(tokenResponse);
    }
}
