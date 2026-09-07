package com.taxi.common.util;


import java.io.*;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

import com.aliyun.oss.*;
import com.aliyun.oss.common.auth.CredentialsProviderFactory;
import com.aliyun.oss.common.auth.EnvironmentVariableCredentialsProvider;
import com.aliyun.oss.common.comm.SignVersion;
import com.taxi.common.config.AliOssProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Component
public class Osspush {
    @Autowired
    private AliOssProperties aliOssProperties;
    /** 生成一个唯一的 Bucket 名称 */
    public String generateUniqueBucketName(String prefixpath) {
        // 获取当前时间戳
        String timestamp = String.valueOf(LocalDateTime.now());
        UUID uuid = UUID.randomUUID();

        return prefixpath +"/" + timestamp + "-" + uuid+".jpg";
    }

    public String push(MultipartFile file,String  prefixpath) throws Exception {
        // Endpoint以华东1（杭州）为例，填写为https://oss-cn-hangzhou.aliyuncs.com，其它Region请按实际情况填写。
        // 填写Bucket所在地域。以华东1（杭州）为例，Region填写为cn-hangzhou。
        String region = aliOssProperties.getRegion();
        String endpoint = aliOssProperties.getEndpoint();
        String bucketName = aliOssProperties.getBucketName();
        log.info("region:{}",region);
        log.info("endpoint:{}",endpoint);
        log.info("bucketName:{}",bucketName);

        // 从环境变量中获取访问凭证。运行本代码示例之前，请先配置环境变量
        EnvironmentVariableCredentialsProvider credentialsProvider = CredentialsProviderFactory.newEnvironmentVariableCredentialsProvider();

        // 创建OSSClient实例。
        // 当OSSClient实例不再使用时，调用shutdown方法以释放资源。
        ClientBuilderConfiguration clientBuilderConfiguration = new ClientBuilderConfiguration();
        // 显式声明使用 V4 签名算法
        clientBuilderConfiguration.setSignatureVersion(SignVersion.V4);
        OSS ossClient = OSSClientBuilder.create()
                .endpoint(endpoint)
                .credentialsProvider(credentialsProvider)
                .clientConfiguration(clientBuilderConfiguration)
                .region(region)
                .build();
        String objectName = generateUniqueBucketName(prefixpath);
        try {
            // 2. 上传文件
            ossClient.putObject(bucketName, objectName, new ByteArrayInputStream(file.getBytes()));
            System.out.println("2. 文件 " + objectName + " 上传成功。");
        } finally {
            ossClient.shutdown();
        }
        return endpoint.split("//")[0] + "//" + bucketName + "." + endpoint.split("//")[1] + "/" + objectName;
    }
}