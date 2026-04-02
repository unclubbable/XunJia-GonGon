package com.taxi.ssePush;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;


@SpringBootApplication
@EnableDiscoveryClient
public class SseDriverClientWebApplication {
    public static void main(String[] args) {
        SpringApplication.run(SseDriverClientWebApplication.class,args);
    }
}
