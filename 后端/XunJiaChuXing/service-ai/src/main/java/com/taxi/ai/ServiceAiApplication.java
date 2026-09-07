package com.taxi.ai;

import com.taxi.api.config.OpenfeignConfig;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.taxi.ai.mapper")
@EnableFeignClients(basePackages = "com.taxi.api.Client", defaultConfiguration = OpenfeignConfig.class)
public class ServiceAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceAiApplication.class, args);
    }
}
