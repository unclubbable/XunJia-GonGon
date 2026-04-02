package com.taxi.api.Client;

import com.taxi.api.dto.OrderInfo;
import com.taxi.api.request.OrderRequest;
import com.taxi.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient("service-order")
public interface ServiceOrderClient {
    @GetMapping("/order/detail")
    public Result<OrderInfo> detail(@RequestParam Long orderId);

    @PostMapping("/order/pay")
    public Result pay(@RequestBody OrderRequest orderRequest);

    @PostMapping("/order/update")
    public Result updateOrder(@RequestBody OrderInfo orderInfo);

}
