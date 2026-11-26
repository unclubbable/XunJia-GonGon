package com.taxi.websocket.auth;

import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServicePassengerUserClient;
import com.taxi.api.dto.DriverUser;
import com.taxi.api.dto.PassengerUser;
import com.taxi.api.result.Result;
import com.taxi.common.model.TokenResult;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.TokenConstants;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * WebSocket 建连鉴权：JWT + Redis 当前 token + identity 匹配 + userId 归属校验。
 */
@Slf4j
@Service
public class WebSocketAuthService {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private ServicePassengerUserClient passengerUserClient;

    @Autowired
    private ServiceDriverUserClient driverUserClient;

    /**
     * @return null 表示通过；非 null 为拒绝原因
     */
    public String authenticate(Long userId, String identity, String token) {
        if (userId == null || !StringUtils.hasText(identity)) {
            return "缺少 userId 或 identity";
        }
        if (!StringUtils.hasText(token)) {
            return "缺少 token";
        }

        TokenResult tokenResult = JwtUtils.checkToken(token.trim());
        if (tokenResult == null) {
            return "token 无效";
        }
        String phone = tokenResult.getPhone();
        String tokenIdentity = tokenResult.getIdentity();
        if (!StringUtils.hasText(phone) || !StringUtils.hasText(tokenIdentity)) {
            return "token 内容不完整";
        }
        if (!identity.equals(tokenIdentity)) {
            return "identity 与 token 不匹配";
        }

        String tokenKey = RedisPrefixUtils.generatorTokenKey(phone, identity, TokenConstants.ACCESS_TOKEN_TYPE);
        String tokenRedis = stringRedisTemplate.opsForValue().get(tokenKey);
        if (!StringUtils.hasText(tokenRedis) || !token.trim().equals(tokenRedis.trim())) {
            // 管理端 Step 3 才会写入 Redis；此前运营无法建连属预期
            return "token 已失效或不在线会话";
        }

        String bindError = bindUserId(userId, identity, phone);
        if (bindError != null) {
            return bindError;
        }
        return null;
    }

    private String bindUserId(Long userId, String identity, String phone) {
        try {
            if (IdentityConstant.PASSENGER_IDENTITY.equals(identity)) {
                Result<PassengerUser> result = passengerUserClient.getPassengerInfo(userId);
                if (result == null || !result.isOk() || result.getData() == null) {
                    return "乘客不存在";
                }
                if (!phone.equals(result.getData().getPassengerPhone())) {
                    return "userId 与 token 主体不匹配";
                }
                return null;
            }
            if (IdentityConstant.DRIVER_IDENTITY.equals(identity)) {
                Result<DriverUser> result = driverUserClient.getDriverInfo(userId);
                if (result == null || !result.isOk() || result.getData() == null) {
                    return "司机不存在";
                }
                if (!phone.equals(result.getData().getDriverPhone())) {
                    return "userId 与 token 主体不匹配";
                }
                return null;
            }
            if (IdentityConstant.ADMIN_IDENTITY.equals(identity)) {
                String uidKey = RedisPrefixUtils.generatorAdminUidKey(phone);
                String uid = stringRedisTemplate.opsForValue().get(uidKey);
                if (!StringUtils.hasText(uid)) {
                    return "管理端 uid 映射未就绪（需登录写入）";
                }
                if (!String.valueOf(userId).equals(uid.trim())) {
                    return "管理端 userId 与账号不匹配";
                }
                return null;
            }
            return "不支持的 identity";
        } catch (Exception e) {
            log.error("WS userId 绑定校验异常 userId={} identity={}", userId, identity, e);
            return "userId 校验异常";
        }
    }
}
