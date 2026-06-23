package com.taxi.price.controller;

import com.taxi.api.dto.PriceRule;
import com.taxi.api.request.PriceRuleIsNewRequest;
import com.taxi.api.result.Result;
import com.taxi.price.service.PriceRuleService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/price-rule")
public class PriceRuleController {
    @Autowired
    private PriceRuleService priceRuleService;


    @ApiOperation("获取所有计价规则")
    @GetMapping("/list")
    public Result getRulesList(@RequestParam int page, @RequestParam int limit, @RequestParam(required=false) String cityCode){
        return priceRuleService.getRulesList(page,limit,cityCode);
    }

    @ApiOperation("添加计价规则")
    @PostMapping("/add")
    public Result add(@RequestBody PriceRule priceRule){
        return priceRuleService.add(priceRule);
    }

    @ApiOperation("更新计价规则")
    @PostMapping("/edit")
    public Result edit(@RequestBody PriceRule priceRule){
        return priceRuleService.edit(priceRule);
    }

    @ApiOperation("查询最新的计价规则")
    @GetMapping("/get-newest-version/{fareType}")
    public Result getNewestVersion(@PathVariable String fareType){
        return priceRuleService.getNewestVersion(fareType);
    }

    @ApiOperation("判断规则是否最新")
    @PostMapping ("/is-new")
    public Result isNew(@RequestBody PriceRuleIsNewRequest priceRuleIsNewRequest){
        return priceRuleService.isNew(priceRuleIsNewRequest.getFareType(),priceRuleIsNewRequest.getFareVersion());
    }

    @ApiOperation("判断城市和对应车型的计价规则是否存在")
    @GetMapping("/if-exists/{cityCode}/{vehicleType}")
    public Result ifPriceExists(@PathVariable String cityCode,@PathVariable String vehicleType){
        return priceRuleService.ifExists(cityCode,vehicleType);
    }
}
