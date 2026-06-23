package com.taxi.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.mapper.bossUserMapper;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import com.taxi.config.bossUser;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.TokenConstants;
import com.taxi.api.request.AdminUser;
import com.taxi.api.response.AdminTokenResponse;
import com.taxi.api.result.Result;
import com.taxi.common.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminUserService {
    // 初始化加密器
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Autowired
    private bossUserMapper bossUserMapper;


    public Result login(AdminUser user){
        QueryWrapper<bossUser> wrapper = new QueryWrapper<bossUser>()
                .eq("username", user.getUsername());
        bossUser bossUser = bossUserMapper.selectOne(wrapper);
        if (bossUser == null){
            return Result.fail().message("用户不存在！");
        }

        String password = bossUser.getPassword();

        if(!encoder.matches(user.getPassword(),password)){
            return Result.fail().message("账号或密码错误！");
        }
        String token = JwtUtils.generatorToken(bossUser.getUsername(), IdentityConstant.ADMIN_IDENTITY, TokenConstants.ACCESS_TOKEN_TYPE);
        AdminTokenResponse adminTokenResponse = new AdminTokenResponse();
        adminTokenResponse.setToken(token);
        return Result.ok(adminTokenResponse);
    }

    public Result getInfo(String token){
        String username = JwtUtils.parseToken(token).getPhone();
        JSONObject userInfo = new JSONObject();
        JSONArray roles = new JSONArray();
        roles.add(username);
        userInfo.put("roles", roles);
        userInfo.put("introduction", "I am a super administrator");
        userInfo.put("avatar", "https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif");
        userInfo.put("name", "Super Admin");
        return Result.ok(userInfo);
    }


    public static void main(String[] args) {
        String raw = "123456";
        String encoded = encoder.encode(raw);
        System.out.println("加密后：" + encoded);
        System.out.println("验证结果：" + encoder.matches(raw, encoded)); // true
    }


}
