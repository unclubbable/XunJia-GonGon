package com.taxi.verificationcode.utils;

import com.aliyun.tea.*;
import com.aliyun.dypnsapi20170525.Client;
import com.aliyun.teaopenapi.models.Config;
import com.taxi.verificationcode.config.aliyunConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class Sample {
    @Autowired
    private aliyunConfig aliyunConfig;


    public void push(String phone,String code,String min) throws Exception {
        // 1. 初始化客户端（建议用环境变量存AK，不要写死在代码里）
        Config config = new Config()
                .setAccessKeyId(aliyunConfig.getAccessKeyId())
                .setAccessKeySecret(aliyunConfig.getAccessKeySecret())
                .setEndpoint("dypnsapi.aliyuncs.com");
        Client client = new Client(config);
        // 2. 创建请求并获取参数
        com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest sendSmsVerifyCodeRequest = new com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest()
                .setPhoneNumber(phone)
                .setSignName("云渚科技验证平台")
                .setTemplateCode("100001")
                .setTemplateParam("{\"code\":\""+code+"\",\"min\":\""+min+"\"}");
        com.aliyun.teautil.models.RuntimeOptions runtime = new com.aliyun.teautil.models.RuntimeOptions();
        try {
            // 发送短信
            com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeResponse resp = client.sendSmsVerifyCodeWithOptions(sendSmsVerifyCodeRequest, runtime);
            System.out.println(new com.google.gson.Gson().toJson(resp));
        } catch (TeaException error) {
            // 此处仅做打印展示，请谨慎对待异常处理，在工程项目中切勿直接忽略异常。
            // 错误 message
            System.out.println(error.getMessage());
            // 诊断地址
            System.out.println(error.getData().get("Recommend"));
        } catch (Exception _error) {
            TeaException error = new TeaException(_error.getMessage(), _error);
            // 此处仅做打印展示，请谨慎对待异常处理，在工程项目中切勿直接忽略异常。
            // 错误 message
            System.out.println(error.getMessage());
            // 诊断地址
            System.out.println(error.getData().get("Recommend"));
        }        
    }
}
