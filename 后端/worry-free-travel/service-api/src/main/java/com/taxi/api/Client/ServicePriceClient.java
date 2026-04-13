package com.taxi.api.Client;

import com.taxi.api.dto.PriceRule;
import com.taxi.api.request.PriceRuleIsNewRequest;
import com.taxi.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient("service-price")
public interface ServicePriceClient {
    @GetMapping("/price-rule/list")
    public Result getRulesList(@RequestParam int page, @RequestParam int limit, @RequestParam(required=false) String cityCode);

    @PostMapping("/price-rule/add")
    public Result add(@RequestBody PriceRule priceRule);

    @PostMapping("/price-rule/edit")
    public Result edit(@RequestBody PriceRule priceRule);

    @PostMapping ("/price-rule/is-new")
    public Result<Boolean> isNew(@RequestBody PriceRuleIsNewRequest priceRuleIsNewRequest);

    @GetMapping("/price-rule/if-exists/{cityCode}/{vehicleType}")
    public Result<Boolean> ifPriceExists(@PathVariable String cityCode, @PathVariable String vehicleType);

    @PostMapping("/calculate-price")
    public Result<Double> calculatePrice(@RequestParam Integer distance, @RequestParam Integer duration,
                                         @RequestParam String cityCode, @RequestParam String vehicleType);
}