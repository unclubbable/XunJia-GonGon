package com.taxi.dispatch;

import com.taxi.api.config.OpenfeignConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.taxi.api.Client",defaultConfiguration = OpenfeignConfig.class)  // 扫描feignClient , 生成feign的bean对象
public class ServiceDispatchApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceDispatchApplication.class, args);
    }
}
