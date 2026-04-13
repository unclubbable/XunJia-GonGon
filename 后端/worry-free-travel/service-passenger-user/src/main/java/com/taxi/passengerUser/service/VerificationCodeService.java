package com.taxi.passengerUser.service;

import com.taxi.api.Client.ServicePassengerUserClient;
import com.taxi.api.Client.ServiceVefificationcodeClient;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.TokenConstants;
import com.taxi.api.request.VerificationCodeDTO;
import com.taxi.api.response.NumberCodeResponse;
import com.taxi.api.response.TokenResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
import io.swagger.models.auth.In;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.concurrent.TimeUnit;


@Slf4j
@Service
public class VerificationCodeService {
    @Autowired
    private ServiceVefificationcodeClient serviceVefificationcodeClient;
    @Autowired
    private ServicePassengerUserClient servicePassengerUserClient;
    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public Result generatorCode(String passengerPhone){
        //调用验证码服务，获取验证码
        NumberCodeResponse data = serviceVefificationcodeClient.getNumberCode(6).getData();
        Integer code=data.getNumberCode();
        NumberCodeResponse numberCodeResponse = new NumberCodeResponse();
        numberCodeResponse.setNumberCode(code);

        String key= RedisPrefixUtils.generatorPassengerKeyByPhone(passengerPhone,IdentityConstant.PASSENGER_IDENTITY);
        //设置验证码超时时间
        Integer verificationTime = 5;
        //存入redis  设置 key 的超时时间（单位为秒）
        stringRedisTemplate.opsForValue().set(key,code+"",verificationTime,TimeUnit.MINUTES);

        //调用短信服务发送验证码（RabbitMQ）
        try {
            rabbitTemplate.convertAndSend("verificationcode.push",null,passengerPhone+"-"+verificationTime+"-"+code);
        } catch (AmqpException e) {
            log.error("发送验证码异常：{}",e.getMessage());
            throw new RuntimeException(e);
        }
        System.out.println("code = " + code);
        return Result.ok(code);   // 为了方便调试，将code返回
    }

    /**
     * 校验验证码
     * @param passengerPhone 手机号
     * @param verificationCode 验证码
     * @return
     */
    public Result checkCode(String passengerPhone,String verificationCode){
        if(ObjectUtils.isEmpty(passengerPhone)||ObjectUtils.isEmpty(verificationCode)){
            ResultCodeEnum anEnum = ResultCodeEnum.VERIFICATION_CODE_ERROR;
            return Result.build(anEnum.getCode(), anEnum.getMessage());
        }

        //根据手机号,去redis读取验证码
        String key=RedisPrefixUtils.generatorPassengerKeyByPhone(passengerPhone,IdentityConstant.PASSENGER_IDENTITY);
        String codeRedis = stringRedisTemplate.opsForValue().get(key);

        //校验验证码
        if (!verificationCode.equals(codeRedis)) {
            ResultCodeEnum anEnum = ResultCodeEnum.CHECK_CODE_ERROR;
            return Result.build(anEnum.getCode(),anEnum.getMessage());
        }

        //判断原来是否有用户,并进行处理
        VerificationCodeDTO verificationCodeDTO = new VerificationCodeDTO();
        verificationCodeDTO.setPassengerPhone(passengerPhone);
        // 远程调用，注册或登录，返回用户信息
        Result result = servicePassengerUserClient.loginOrReg(verificationCodeDTO);

        //颁发令牌,不应该用魔法值,用常量
        String accessToken = JwtUtils.generatorToken(passengerPhone, IdentityConstant.PASSENGER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        String refreshToken=JwtUtils.generatorToken(passengerPhone,IdentityConstant.PASSENGER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);

        //将token存到redis当中
        String accessTokenKey = RedisPrefixUtils.generatorTokenKey(passengerPhone, IdentityConstant.PASSENGER_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        stringRedisTemplate.opsForValue().set(accessTokenKey,accessToken,30,TimeUnit.DAYS);//过期时间30天

        String refreshTokenKey = RedisPrefixUtils.generatorTokenKey(passengerPhone, IdentityConstant.PASSENGER_IDENTITY, TokenConstants.REFRESH_TOKEN_TYPE);
        stringRedisTemplate.opsForValue().set(refreshTokenKey,refreshToken,31,TimeUnit.DAYS);//过期时间31天

        //响应
        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setAccessToken(accessToken);
        tokenResponse.setRefreshToken(refreshToken);
        result.setData(tokenResponse);
        return result;
    }
}
