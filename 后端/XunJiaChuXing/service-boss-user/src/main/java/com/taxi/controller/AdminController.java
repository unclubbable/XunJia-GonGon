package com.taxi.controller;

import com.taxi.api.request.AdminUser;
import com.taxi.api.result.Result;
import com.taxi.config.RsaKeyConfig;
import com.taxi.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.Map;

/**
 * 管理端登录等接口。
 * 网关入口为 /boss-user/**，StripPrefix=1 后落到本服务，故此处不再带 /boss-user 前缀。
 */
@RestController
public class AdminController {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private RsaKeyConfig.RsaKeyHolder rsaKeyHolder;

    /**
     * 登录用 RSA 公钥（PEM），前端加密 password 后再提交
     */
    @GetMapping("/login/public-key")
    public Result publicKey() {
        Map<String, String> data = Collections.singletonMap("publicKey", rsaKeyHolder.getPublicKeyPem());
        return Result.ok(data);
    }

    /**
     * 登录（password 为 RSA 密文 Base64）
     */
    @PostMapping("/login")
    public Result login(@RequestBody AdminUser user) {
        return adminUserService.login(user);
    }

    /**
     * 获取用户信息
     */
    @GetMapping("/info")
    public Result getInfo(@RequestParam String token) {
        return adminUserService.getInfo(token);
    }

    /**
     * 登出：清除 Redis token，并关闭本端 WS
     */
    @PostMapping("/logout")
    public Result logout(HttpServletRequest request) {
        String token = resolveToken(request);
        return adminUserService.logout(token);
    }

    private String resolveToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (StringUtils.hasText(auth)) {
            return auth.trim();
        }
        String xToken = request.getHeader("X-Token");
        if (StringUtils.hasText(xToken)) {
            return xToken.trim();
        }
        return request.getParameter("token");
    }
}
