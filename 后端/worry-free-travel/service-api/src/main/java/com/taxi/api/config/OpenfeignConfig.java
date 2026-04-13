package com.taxi.api.config;

import cn.hutool.json.JSONUtil;
import com.taxi.common.ThreadLoad.TokenResult;
import com.taxi.common.util.UserContext;
import feign.Logger;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

@Slf4j
@Configuration
public class OpenfeignConfig {
    @Bean
    public Logger.Level openfeignLoggerLevel() {
        return Logger.Level.FULL;
    }
    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate requestTemplate) {
                TokenResult user = UserContext.getUser();
                if (user != null) {
                    log.debug("feign拦截器添加用户信息到头:"+ JSONUtil.toJsonStr(user));
                    String userJson = JSONUtil.toJsonStr(user);
                    // 编码后再放入header
                    String encodeUser = null;
                    try {
                        encodeUser = URLEncoder.encode(userJson, "UTF-8");
                    } catch (UnsupportedEncodingException e) {
                        throw new RuntimeException(e);
                    }
                    requestTemplate.header("tokenResult", encodeUser);
                }
            }
        };
     }
}
