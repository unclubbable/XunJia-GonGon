package com.xunjia.order;

import com.xunjia.api.config.OpenfeignConfig;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@MapperScan("com.xunjia.order.mapper")
@EnableFeignClients(basePackages = "com.xunjia.api.Client", defaultConfiguration = OpenfeignConfig.class)
public class ServiceOrderApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceOrderApplication.class,args);
    }
}
