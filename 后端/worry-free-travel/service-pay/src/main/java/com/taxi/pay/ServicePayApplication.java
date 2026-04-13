package com.taxi.pay;

import com.taxi.api.config.OpenfeignConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.web.bind.annotation.RestController;


@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
@EnableFeignClients(basePackages = "com.taxi.api.Client",defaultConfiguration = OpenfeignConfig.class)
@RestController
public class ServicePayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServicePayApplication.class,args);
    }
}
