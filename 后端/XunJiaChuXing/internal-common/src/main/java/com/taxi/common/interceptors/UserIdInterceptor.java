package com.taxi.common.interceptors;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.taxi.common.ThreadLoad.TokenResult;
import com.taxi.common.util.UserContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.net.URLDecoder;

@Slf4j
@Component
public class UserIdInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        log.debug("服务过滤器");
        // 1.获取登录用户信息
        String tokenResultURLencoder = request.getHeader("tokenResult");
        if (StrUtil.isNotBlank(tokenResultURLencoder)) {
            String tokenResult = URLDecoder.decode(tokenResultURLencoder, "UTF-8");
            log.debug("用户tokenResult："+tokenResult);
            // 2. 判断是否获取到tokenResult，如果有，则存入ThreadLocal
            log.debug("登录信息写入:"+ tokenResult);
            UserContext.setUser(JSONUtil.toBean(tokenResult, TokenResult.class));
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 清理用户
        UserContext.removeUser();
    }
}
