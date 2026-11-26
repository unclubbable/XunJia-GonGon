package com.xunjia.ticket;

import com.xunjia.api.config.OpenfeignConfig;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.xunjia.ticket.mapper")
@EnableFeignClients(basePackages = "com.xunjia.api.Client", defaultConfiguration = OpenfeignConfig.class)
public class ServiceTicketApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceTicketApplication.class, args);
    }
}
