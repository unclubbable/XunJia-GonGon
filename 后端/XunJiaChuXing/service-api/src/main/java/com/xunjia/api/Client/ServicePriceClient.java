package com.xunjia.api.Client;

import com.xunjia.api.dto.PriceRule;
import com.xunjia.api.request.PriceRuleIsNewRequest;
import com.xunjia.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

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

    @GetMapping("/price-rule/cities-by-vehicle-type/{vehicleType}")
    Result listCitiesByVehicleType(@PathVariable String vehicleType);

    @GetMapping("/price-rule/vehicle-types-by-city/{cityCode}")
    Result listVehicleTypesByCity(@PathVariable String cityCode);

    @PostMapping("/calculate-price")
    public Result<BigDecimal> calculatePrice(@RequestParam Integer distance, @RequestParam Integer duration,
                                             @RequestParam String cityCode, @RequestParam String vehicleType);
}