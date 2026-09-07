package com.taxi;

import com.taxi.api.config.OpenfeignConfig;
import com.taxi.config.bossUser;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication()
@MapperScan("com.taxi.mapper")
@EnableFeignClients(basePackages = "com.taxi.api.Client", defaultConfiguration = OpenfeignConfig.class)
public class ServiceBossUserApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceBossUserApplication.class,args);
    }
}
