package com.taxi.verificationcode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;


@SpringBootApplication
@EnableDiscoveryClient
public class ServiceVerificationCodeApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceVerificationCodeApplication.class,args);
    }
}
