package com.taxi.common.util;

import com.aliyun.dypnsapi20170525.Client;
import com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeRequest;
import com.aliyun.dypnsapi20170525.models.SendSmsVerifyCodeResponse;
import com.aliyun.tea.TeaException;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.models.RuntimeOptions;
import com.taxi.common.config.AliyunSmsProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 公共短信验证码发送工具
 */
@Slf4j
@Component
public class SmsVerifyCodeSender {

    @Autowired
    private AliyunSmsProperties aliyunSmsProperties;

    /**
     * 发送短信验证码
     *
     * @param phone 手机号
     * @param code  验证码
     * @param min   有效分钟数
     */
    public void send(String phone, String code, String min) throws Exception {
        if (!StringUtils.hasText(aliyunSmsProperties.getAccessKeyId())
                || !StringUtils.hasText(aliyunSmsProperties.getAccessKeySecret())) {
            log.warn("未配置 aliyun.accessKeyId/accessKeySecret，跳过真实短信发送。phone={}, code={}", phone, code);
            return;
        }

        Config config = new Config()
                .setAccessKeyId(aliyunSmsProperties.getAccessKeyId())
                .setAccessKeySecret(aliyunSmsProperties.getAccessKeySecret())
                .setEndpoint(aliyunSmsProperties.getEndpoint());
        Client client = new Client(config);

        SendSmsVerifyCodeRequest request = new SendSmsVerifyCodeRequest()
                .setPhoneNumber(phone)
                .setSignName(aliyunSmsProperties.getSignName())
                .setTemplateCode(aliyunSmsProperties.getTemplateCode())
                .setTemplateParam("{\"code\":\"" + code + "\",\"min\":\"" + min + "\"}");
        RuntimeOptions runtime = new RuntimeOptions();
        try {
            SendSmsVerifyCodeResponse resp = client.sendSmsVerifyCodeWithOptions(request, runtime);
            log.info("短信发送成功, phone={}, statusCode={}", phone,
                    resp != null && resp.getStatusCode() != null ? resp.getStatusCode() : "unknown");
        } catch (TeaException error) {
            log.error("短信发送失败: {}, recommend={}", error.getMessage(),
                    error.getData() != null ? error.getData().get("Recommend") : null);
            throw error;
        } catch (Exception e) {
            log.error("短信发送异常: {}", e.getMessage(), e);
            throw e;
        }
    }
}
