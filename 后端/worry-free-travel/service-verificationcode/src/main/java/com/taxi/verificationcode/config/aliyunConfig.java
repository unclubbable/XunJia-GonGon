package com.taxi.verificationcode.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Data
@ConfigurationProperties(prefix = "aliyun")
public class aliyunConfig {
    private String AccessKeyId;
    private String AccessKeySecret;
}
