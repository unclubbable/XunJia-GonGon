package com.taxi.common.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Data
@Configuration
public class AliOssProperties {
    /**
     * OSS Endpoint
     */
    private String endpoint = "https://oss-cn-beijing.aliyuncs.com";

    /**
     * OSS Region
     */
    private String region = "cn-beijing";

    /**
     * OSS Bucket 名称
     */
    private String bucketName = "java-cjw11";
}
