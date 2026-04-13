package com.taxi.dispatch.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class RedisConfig {
    private String potoclo = "redis://";
    @Value("${spring.redis.host}")
    private String redisHost;
    @Value("${spring.redis.port}")
    private String redisPort;
    @Value("${spring.redis.password}")
    private String redisPassword;

    @Bean
    public RedissonClient redisClient(){
        Config config = new Config();
        String localhost = potoclo + redisHost + ":" + redisPort;
        config.useSingleServer().setAddress(localhost).setPassword(redisPassword).setDatabase(0);
        return Redisson.create(config);
    }
}

