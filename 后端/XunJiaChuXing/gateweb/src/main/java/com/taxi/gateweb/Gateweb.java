package com.taxi.gateweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

/**
 * 统一网关：用 /driver-user、/passenger-user、/boss-user 分别管理三端流量
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class Gateweb {
    public static void main(String[] args) {
        SpringApplication.run(Gateweb.class, args);
    }
}
