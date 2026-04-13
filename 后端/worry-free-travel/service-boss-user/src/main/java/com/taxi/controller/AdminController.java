package com.taxi.controller;

import com.taxi.api.request.AdminUser;
import com.taxi.api.result.Result;
import com.taxi.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/boss-user")
public class AdminController {

    @Autowired
    private AdminUserService adminUserService;
    /**
     * 登录
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
