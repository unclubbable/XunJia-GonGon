package com.taxi.gatewebdriver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class DriverGateweb {
    public static void main(String[] args) {
        SpringApplication.run(DriverGateweb.class, args);
    }
}
