package com.xunjia.gateweb.auth;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 统一网关鉴权白名单
 */
@Data
@Component
@ConfigurationProperties(prefix = "auth")
public class InPath {
    private List<String> inpath;


}
