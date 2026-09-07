package com.taxi.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 阿里云短信验证码配置，由各业务服务在 application.yml 中配置 aliyun.*
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "aliyun")
public class AliyunSmsProperties {

    private String accessKeyId;

    private String accessKeySecret;

    /** 短信签名 */
    private String signName = "云渚科技验证平台";

    /** 短信模板编码 */
    private String templateCode = "100001";

    private String endpoint = "dypnsapi.aliyuncs.com";
}
