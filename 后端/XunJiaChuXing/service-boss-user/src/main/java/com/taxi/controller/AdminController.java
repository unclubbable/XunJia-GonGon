package com.taxi.controller;

import com.taxi.api.request.AdminUser;
import com.taxi.api.result.Result;
import com.taxi.config.RsaKeyConfig;
import com.taxi.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping(value = "/boss-user")
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
    public Result login(@RequestBody AdminUser user){
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
     * 登出
     */
    @PostMapping("/logout")
    public Result logout(){
        return Result.ok();
    }
}
