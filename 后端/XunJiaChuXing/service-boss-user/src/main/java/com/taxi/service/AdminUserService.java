package com.taxi.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.api.Client.ServiceWsPushClient;
import com.taxi.api.request.AdminUser;
import com.taxi.api.request.KickRequest;
import com.taxi.api.response.AdminTokenResponse;
import com.taxi.api.result.Result;
import com.taxi.common.model.TokenResult;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.TokenConstants;
import com.taxi.common.util.JwtUtils;
import com.taxi.common.util.RedisPrefixUtils;
import com.taxi.config.RsaKeyConfig;
import com.taxi.config.BossUser;
import com.taxi.mapper.BossUserMapper;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AdminUserService {

    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private static final long ACCESS_TOKEN_DAYS = 30;

    @Autowired
    private BossUserMapper bossUserMapper;

    @Autowired
    private RsaKeyConfig.RsaKeyHolder rsaKeyHolder;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private ServiceWsPushClient serviceWsPushClient;

    public Result login(AdminUser user) {
        if (user == null || !StringUtils.hasText(user.getUsername()) || !StringUtils.hasText(user.getPassword())) {
            return Result.fail().message("账号或密码不能为空！");
        }

        String rawPassword;
        try {
            rawPassword = rsaKeyHolder.decrypt(user.getPassword());
        } catch (Exception e) {
            return Result.fail().message("密码解密失败，请刷新后重试！");
        }

        QueryWrapper<BossUser> wrapper = new QueryWrapper<BossUser>()
                .eq("username", user.getUsername());
        BossUser boss = bossUserMapper.selectOne(wrapper);
        if (boss == null) {
            return Result.fail().message("用户不存在！");
        }
        if (boss.getId() == null) {
            return Result.fail().message("账号数据异常：缺少用户ID");
        }

        if (!encoder.matches(rawPassword, boss.getPassword())) {
            return Result.fail().message("账号或密码错误！");
        }

        String username = boss.getUsername();
        Integer userId = boss.getId();

        // 方案 A：先覆盖 Redis（旧 HTTP 立刻失效），再踢旧 WS
        String token = JwtUtils.generatorToken(username, IdentityConstant.ADMIN_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        String tokenKey = RedisPrefixUtils.generatorTokenKey(username, IdentityConstant.ADMIN_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        stringRedisTemplate.opsForValue().set(tokenKey, token, ACCESS_TOKEN_DAYS, TimeUnit.DAYS);

        String uidKey = RedisPrefixUtils.generatorAdminUidKey(username);
        stringRedisTemplate.opsForValue().set(uidKey, String.valueOf(userId), ACCESS_TOKEN_DAYS, TimeUnit.DAYS);

        kickOldWebSocket(userId.longValue());

        AdminTokenResponse resp = new AdminTokenResponse();
        resp.setToken(token);
        resp.setUserId(userId);
        resp.setUsername(username);
        log.info("管理端登录成功 username={} userId={}", username, userId);
        return Result.ok(resp);
    }

    public Result getInfo(String token) {
        TokenResult tokenResult = JwtUtils.checkToken(token);
        if (tokenResult == null || !StringUtils.hasText(tokenResult.getPhone())) {
            return Result.fail().message("token无效");
        }
        String username = tokenResult.getPhone();
        BossUser boss = bossUserMapper.selectOne(new QueryWrapper<BossUser>().eq("username", username));

        JSONObject userInfo = new JSONObject();
        JSONArray roles = new JSONArray();
        roles.add(username);
        userInfo.put("roles", roles);
        userInfo.put("introduction", "I am a super administrator");
        userInfo.put("avatar", "https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif");
        userInfo.put("name", boss != null && StringUtils.hasText(boss.getUsername()) ? boss.getUsername() : "Super Admin");
        userInfo.put("username", username);
        if (boss != null && boss.getId() != null) {
            userInfo.put("userId", boss.getId());
        }
        return Result.ok(userInfo);
    }

    public Result logout(String token) {
        if (!StringUtils.hasText(token)) {
            return Result.ok();
        }
        TokenResult tokenResult = JwtUtils.checkToken(token.trim());
        if (tokenResult == null || !StringUtils.hasText(tokenResult.getPhone())) {
            return Result.ok();
        }
        String username = tokenResult.getPhone();
        String tokenKey = RedisPrefixUtils.generatorTokenKey(username, IdentityConstant.ADMIN_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        String current = stringRedisTemplate.opsForValue().get(tokenKey);
        if (StringUtils.hasText(current) && current.trim().equals(token.trim())) {
            stringRedisTemplate.delete(tokenKey);
        }
        String uidStr = stringRedisTemplate.opsForValue().get(RedisPrefixUtils.generatorAdminUidKey(username));
        if (StringUtils.hasText(uidStr)) {
            try {
                KickRequest kick = new KickRequest();
                kick.setUserId(Long.parseLong(uidStr.trim()));
                kick.setIdentity(IdentityConstant.ADMIN_IDENTITY);
                kick.setSendForceLogout(false);
                serviceWsPushClient.kick(kick);
            } catch (Exception e) {
                log.warn("登出踢 WS 失败 username={}", username, e);
            }
        }
        return Result.ok();
    }

    private void kickOldWebSocket(Long userId) {
        try {
            KickRequest kick = new KickRequest();
            kick.setUserId(userId);
            kick.setIdentity(IdentityConstant.ADMIN_IDENTITY);
            kick.setSendForceLogout(true);
            String r = serviceWsPushClient.kick(kick);
            log.info("登录踢旧 WS userId={} result={}", userId, r);
        } catch (Exception e) {
            // 踢失败不阻断登录（例如 websocket 未启动）
            log.warn("登录踢旧 WS 失败 userId={}（可忽略若服务未启动）", userId, e);
        }
    }
}
