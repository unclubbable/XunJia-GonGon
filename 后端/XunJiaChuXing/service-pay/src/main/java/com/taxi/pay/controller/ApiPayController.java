package com.taxi.pay.controller;

import cn.hutool.json.JSONUtil;
import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.AlipayConfig;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradeWapPayModel;
import com.alipay.api.request.AlipayTradeWapPayRequest;
import com.alipay.api.response.AlipayTradeWapPayResponse;
import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceOrderClient;
import com.taxi.api.Client.ServiceSsePushClient;
import com.taxi.api.dto.OrderInfo;
import com.taxi.api.request.PushRequest;
import com.taxi.api.result.Result;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.OrderConstants;
import io.seata.spring.annotation.GlobalTransactional;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;


@Slf4j
@Controller
@RequestMapping("/alipay")
@ResponseBody
public class ApiPayController {
    @Autowired
    private ServiceOrderClient serviceOrderClient;

    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;

    @Autowired
    private ServiceSsePushClient serviceSsePushClient;

    @ApiOperation("支付")
    @GetMapping("/pay")
    public String pay(String subject,String outTradeNo,String totalAmount) throws AlipayApiException {
        /**
         //             * subject : 订单名
         //             * outTradeNo : 订单号
         //             * totalAmount : 订单金额
         //             * returnUrl : 回调地址 后端需要过滤处理订单数据就回调后端，不需要直接回调前端url就行，
         //             * 同步回调后端也可以获的订单数据
         //             */

        log.error("开始调用支付宝接口--subject:"+subject+"--outTradeNo:"+outTradeNo+"--totalAmount:"+totalAmount);
        // 初始化SDK
        AlipayClient alipayClient = new DefaultAlipayClient(getAlipayConfig());

        // 构造请求参数以调用接口
        AlipayTradeWapPayRequest request = new AlipayTradeWapPayRequest();
        AlipayTradeWapPayModel model = new AlipayTradeWapPayModel();

        // 设置商户订单号
        model.setOutTradeNo(outTradeNo);

        // 设置订单总金额
        model.setTotalAmount(totalAmount);

        // 设置订单标题
        model.setSubject(subject);

        // 设置产品码
        model.setProductCode("QUICK_WAP_WAY");

        // 设置针对用户授权接口
        model.setAuthToken("appopenBb64d181d0146481ab6a762c00714cC27");

        // 设置用户付款中途退出返回商户网站的地址
        // model.setQuitUrl("http://www.taobao.com/product/113714.html");

        // 设置订单绝对超时时间
        // model.setTimeExpire(new Date().toString());

        request.setBizModel(model);

        request.setNotifyUrl("http://0.0.0.0/alipay/notify");
        AlipayTradeWapPayResponse response = alipayClient.pageExecute(request, "POST");
        String pageRedirectionData = response.getBody();

        if (response.isSuccess()) {
            System.out.println("调用成功");
        } else {
            System.out.println("调用失败");
            // sdk版本是"4.38.0.ALL"及以上,可以参考下面的示例获取诊断链接
            // String diagnosisUrl = DiagnosisUtils.getDiagnosisUrl(response);
            // System.out.println(diagnosisUrl);
        }
        return pageRedirectionData;
    }

    private static AlipayConfig getAlipayConfig() {
        String privateKey  = "";
        String alipayPublicKey = "";
        AlipayConfig alipayConfig = new AlipayConfig();
        alipayConfig.setServerUrl("https://0.0.0.0/gateway.do");
        alipayConfig.setAppId("00000000000000000000000");
        alipayConfig.setPrivateKey(privateKey);
        alipayConfig.setFormat("json");
        alipayConfig.setAlipayPublicKey(alipayPublicKey);
        alipayConfig.setCharset("UTF-8");
        alipayConfig.setSignType("RSA2");
        return alipayConfig;
    }


    @GlobalTransactional(rollbackFor = Exception.class)
    @PostMapping("/notify")
    public void notify(String trade_no, String trade_status, String total_amount,String out_trade_no) throws AlipayApiException {
        log.info("回调函数--订单号:"+out_trade_no+"--订单状态:"+trade_status+"--订单金额"+total_amount+"--支付宝交易号:"+trade_no);
        //支付成功
        if ("TRADE_SUCCESS".equals(trade_status)){
            // 1. 修改订单
            //根据支付单号查询订单
            OrderInfo data = serviceOrderClient.detail(Long.valueOf(out_trade_no)).getData();
            //修改订单状态写入支付宝交易号
            data.setOrderStatus(OrderConstants.SUCCESS_PAY);
            data.setPayOrderId(trade_no);
            //修改订单
            serviceOrderClient.updateOrder(data);
            // 2. 添加司机收入
            serviceDriverUserClient.addMoneyByDriverId(data.getDriverId(), Double.valueOf(total_amount));



            // 3. 给乘客推送消息
            PushRequest pushRequest = new PushRequest();
            pushRequest.setUserId(data.getPassengerId());
            pushRequest.setIdentity(IdentityConstant.PASSENGER_IDENTITY);
            Result<String> result = new Result<>();
            result.setCode(OrderConstants.RESULT_CODE_PAY_SUCCESS)
                            .message("支付成功");
            pushRequest.setContent(JSONUtil.toJsonStr(result));
            try {
                serviceSsePushClient.push(pushRequest);
            } catch (Exception e) {
                log.error("支付成功消息推送异常");
                throw new RuntimeException(e);
            }
        }
    }

}
