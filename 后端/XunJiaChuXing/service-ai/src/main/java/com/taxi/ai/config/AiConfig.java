package com.taxi.ai.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class AiConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }

    @Bean
    public RestTemplate agentRestTemplate(RestTemplateBuilder builder,
                                          @org.springframework.beans.factory.annotation.Value("${agent.connect-timeout-ms:3000}") long connectMs,
                                          @org.springframework.beans.factory.annotation.Value("${agent.read-timeout-ms:60000}") long readMs) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectMs))
                .setReadTimeout(Duration.ofMillis(readMs))
                .build();
    }
}
