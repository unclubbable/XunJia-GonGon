package com.taxi.order.controller;

import cn.hutool.json.JSONUtil;
import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.AlipayConfig;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradeWapPayModel;
import com.alipay.api.request.AlipayTradeFastpayRefundQueryRequest;
import com.alipay.api.request.AlipayTradeRefundRequest;
import com.alipay.api.request.AlipayTradeWapPayRequest;
import com.alipay.api.response.AlipayTradeFastpayRefundQueryResponse;
import com.alipay.api.response.AlipayTradeRefundResponse;
import com.alipay.api.response.AlipayTradeWapPayResponse;
import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceSsePushClient;
import com.taxi.api.dto.OrderInfo;
import com.taxi.api.request.AlipayRefundRequest;
import com.taxi.api.request.PushRequest;
import com.taxi.api.response.AlipayRefundResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.util.FeignResultUtils;
import com.taxi.common.constant.IdentityConstant;
import com.taxi.common.constant.OrderConstants;
import com.taxi.order.service.IOrderInfoService;
import io.seata.spring.annotation.GlobalTransactional;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Slf4j
@Controller
@RequestMapping("/alipay")
@ResponseBody
public class ApiPayController {
    @Autowired
    private IOrderInfoService orderInfoService;

    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;

    @Autowired
    private ServiceSsePushClient serviceSsePushClient;

    @Value("${alipay.app-id:CHANGE_ME}")
    private String alipayAppId;

    @Value("${alipay.private-key:CHANGE_ME}")
    private String alipayPrivateKey;

    @Value("${alipay.alipay-public-key:CHANGE_ME}")
    private String alipayPublicKey;

    @Value("${alipay.server-url:https://openapi-sandbox.dl.alipaydev.com/gateway.do}")
    private String alipayServerUrl;

    @Value("${alipay.notify-url:}")
    private String alipayNotifyUrl;

    @Value("${alipay.auth-token:}")
    private String alipayAuthToken;

    @ApiOperation("支付")
    @GetMapping("/pay")
    public String pay(String subject, String outTradeNo, String totalAmount) throws AlipayApiException {
        log.error("开始调用支付宝接口--subject:" + subject + "--outTradeNo:" + outTradeNo + "--totalAmount:" + totalAmount);
        AlipayClient alipayClient = new DefaultAlipayClient(getAlipayConfig());

        AlipayTradeWapPayRequest request = new AlipayTradeWapPayRequest();
        AlipayTradeWapPayModel model = new AlipayTradeWapPayModel();

        model.setOutTradeNo(outTradeNo);
        model.setTotalAmount(totalAmount);
        model.setSubject(subject);
        model.setProductCode("QUICK_WAP_WAY");
        if (StringUtils.hasText(alipayAuthToken)) {
            model.setAuthToken(alipayAuthToken);
        }

        request.setBizModel(model);
        request.setNotifyUrl(alipayNotifyUrl);
        AlipayTradeWapPayResponse response = alipayClient.pageExecute(request, "POST");
        String pageRedirectionData = response.getBody();

        if (response.isSuccess()) {
            log.info("调用成功");
        } else {
            log.error("调用失败");
        }
        return pageRedirectionData;
    }

    /**
     * 支付宝原路退款（沙箱）。trade_no 使用支付回调写入的 payOrderId。
     * 超时/网络异常时会按同一 out_request_no 查单，已退成功则按成功返回，避免「钱已到账却报失败」。
     */
    @ApiOperation("支付宝退款")
    @PostMapping("/refund")
    public Result<AlipayRefundResponse> refund(@RequestBody AlipayRefundRequest refundRequest) {
        AlipayRefundResponse data = new AlipayRefundResponse();
        if (refundRequest == null
                || !StringUtils.hasText(refundRequest.getTradeNo())
                || !StringUtils.hasText(refundRequest.getOutRequestNo())
                || !StringUtils.hasText(refundRequest.getRefundAmount())) {
            data.setSuccess(false);
            data.setMessage("退款参数不完整");
            return Result.fail(ResultCodeEnum.PARAM_ERROR, "退款参数不完整");
        }
        String tradeNo = refundRequest.getTradeNo().trim();
        String outRequestNo = refundRequest.getOutRequestNo().trim();
        data.setOutRequestNo(outRequestNo);
        data.setTradeNo(tradeNo);

        try {
            AlipayClient alipayClient = new DefaultAlipayClient(getAlipayConfig());

            // 幂等：若该退款请求号已成功，直接按成功返回（覆盖上次超时已退款的场景）
            AlipayRefundResponse queried = queryRefundIfSuccess(alipayClient, tradeNo, outRequestNo);
            if (queried != null) {
                log.info("支付宝退款查单已成功 outRequestNo={} refundFee={}",
                        outRequestNo, queried.getRefundFee());
                return Result.ok(queried);
            }

            AlipayTradeRefundRequest request = new AlipayTradeRefundRequest();
            cn.hutool.json.JSONObject biz = new cn.hutool.json.JSONObject();
            biz.set("trade_no", tradeNo);
            biz.set("out_request_no", outRequestNo);
            biz.set("refund_amount", refundRequest.getRefundAmount().trim());
            if (StringUtils.hasText(refundRequest.getRefundReason())) {
                biz.set("refund_reason", refundRequest.getRefundReason().trim());
            }
            request.setBizContent(biz.toString());
            AlipayTradeRefundResponse response = alipayClient.execute(request);
            data.setTradeNo(StringUtils.hasText(response.getTradeNo()) ? response.getTradeNo() : tradeNo);
            data.setRefundFee(response.getRefundFee());
            data.setFundChange(response.getFundChange());
            data.setMessage(response.getSubMsg() != null ? response.getSubMsg() : response.getMsg());
            if (response.isSuccess()) {
                data.setSuccess(true);
                log.info("支付宝退款成功 outRequestNo={} refundFee={}", outRequestNo, response.getRefundFee());
                return Result.ok(data);
            }
            data.setSuccess(false);
            log.warn("支付宝退款失败 outRequestNo={} code={} subMsg={}",
                    outRequestNo, response.getCode(), response.getSubMsg());
            return Result.fail(data).message(data.getMessage() != null ? data.getMessage() : "支付宝退款失败");
        } catch (AlipayApiException e) {
            log.error("支付宝退款异常 outRequestNo={}，尝试查单确认", outRequestNo, e);
            try {
                AlipayClient alipayClient = new DefaultAlipayClient(getAlipayConfig());
                AlipayRefundResponse queried = queryRefundIfSuccess(alipayClient, tradeNo, outRequestNo);
                if (queried != null) {
                    log.info("退款接口超时/异常，但查单确认已退成功 outRequestNo={}", outRequestNo);
                    return Result.ok(queried);
                }
            } catch (Exception queryEx) {
                log.warn("支付宝退款查单失败 outRequestNo={}", outRequestNo, queryEx);
            }
            data.setSuccess(false);
            String tip = e.getErrMsg() != null ? e.getErrMsg() : e.getMessage();
            if (tip != null && tip.toLowerCase().contains("timed out")) {
                tip = "支付宝退款超时，结果未知，请稍后重试（同一退款单会查单确认）";
            }
            data.setMessage(tip);
            return Result.fail(data).message(data.getMessage());
        }
    }

    /**
     * 查询退款是否已成功。成功则返回组装好的成功结果，否则返回 null。
     */
    private AlipayRefundResponse queryRefundIfSuccess(AlipayClient alipayClient,
                                                      String tradeNo,
                                                      String outRequestNo) throws AlipayApiException {
        AlipayTradeFastpayRefundQueryRequest queryRequest = new AlipayTradeFastpayRefundQueryRequest();
        cn.hutool.json.JSONObject biz = new cn.hutool.json.JSONObject();
        biz.set("trade_no", tradeNo);
        biz.set("out_request_no", outRequestNo);
        queryRequest.setBizContent(biz.toString());
        AlipayTradeFastpayRefundQueryResponse queryResponse = alipayClient.execute(queryRequest);
        if (queryResponse == null || !queryResponse.isSuccess()) {
            return null;
        }
        // 新接口：refund_status=REFUND_SUCCESS；旧沙箱可能只回 refund_amount
        String refundStatus = queryResponse.getRefundStatus();
        boolean statusOk = !StringUtils.hasText(refundStatus) || "REFUND_SUCCESS".equalsIgnoreCase(refundStatus);
        boolean hasAmount = StringUtils.hasText(queryResponse.getRefundAmount());
        if (!statusOk || !hasAmount) {
            return null;
        }
        AlipayRefundResponse data = new AlipayRefundResponse();
        data.setSuccess(true);
        data.setTradeNo(StringUtils.hasText(queryResponse.getTradeNo()) ? queryResponse.getTradeNo() : tradeNo);
        data.setOutRequestNo(outRequestNo);
        data.setRefundFee(queryResponse.getRefundAmount());
        data.setMessage("查单确认退款成功");
        return data;
    }

    private AlipayConfig getAlipayConfig() {
        AlipayConfig alipayConfig = new AlipayConfig();
        alipayConfig.setServerUrl(alipayServerUrl);
        alipayConfig.setAppId(alipayAppId);
        alipayConfig.setPrivateKey(alipayPrivateKey);
        alipayConfig.setFormat("json");
        alipayConfig.setAlipayPublicKey(alipayPublicKey);
        alipayConfig.setCharset("UTF-8");
        alipayConfig.setSignType("RSA2");
        // 沙箱偶发慢，适当加大读超时，减少「已退成功却本地超时」
        alipayConfig.setConnectTimeout(15000);
        alipayConfig.setReadTimeout(60000);
        return alipayConfig;
    }

    @GlobalTransactional(rollbackFor = Exception.class)
    @PostMapping("/notify")
    public void notify(String trade_no, String trade_status, String total_amount, String out_trade_no) {
        log.info("回调函数--订单号:" + out_trade_no + "--订单状态:" + trade_status + "--订单金额" + total_amount + "--支付宝交易号:" + trade_no);
        if ("TRADE_SUCCESS".equals(trade_status)) {
            Result<OrderInfo> detailResult = orderInfoService.detail(Long.valueOf(out_trade_no));
            OrderInfo data = FeignResultUtils.checkAndGet(detailResult, ResultCodeEnum.ORDER_NOT_EXISTS);
            data.setOrderStatus(OrderConstants.SUCCESS_PAY);
            data.setPayOrderId(trade_no);
            orderInfoService.updateOrder(data);
            serviceDriverUserClient.addMoneyByDriverId(data.getDriverId(), Double.valueOf(total_amount));

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
