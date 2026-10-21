package com.taxi.price.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.api.Client.ServiceMapClient;
import com.taxi.api.dto.PriceRule;
import com.taxi.price.mapper.PriceRuleMapper;
import com.taxi.api.request.ForecastPriceDOT;
import com.taxi.api.response.DirectionResponse;
import com.taxi.api.response.ForecastPriceResponse;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.util.FeignResultUtils;
import com.taxi.common.util.BigDecimalUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.math.BigDecimal;
import java.util.List;


@Service
public class PriceService {
    @Autowired
    private ServiceMapClient serviceMapClient;

    @Autowired
    private PriceRuleMapper priceRuleMapper;

    public Result forecastPrice(ForecastPriceDOT forecastPriceDOT) {
        DirectionResponse direction = FeignResultUtils.checkAndGet(
                serviceMapClient.driving(forecastPriceDOT), ResultCodeEnum.MAP_DISTRICT_ERROR);
        Integer distance = direction.getDistance();
        Integer duration = direction.getDuration();

        String cityCode = forecastPriceDOT.getCityCode();
        String vehicleType = forecastPriceDOT.getVehicleType();

        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");
        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (ObjectUtils.isEmpty(priceRules)) {
            return Result.fail(ResultCodeEnum.PRICE_RULE_EMPTY);
        }
        PriceRule priceRule = priceRules.get(0);

        PriceCalcResult calc = getPrice(distance, duration, priceRule);

        ForecastPriceResponse forecastPriceResponse = new ForecastPriceResponse();
        forecastPriceResponse.setTimeMinute(calc.timeMinute.doubleValue());
        forecastPriceResponse.setDistanceMile(calc.distanceMile.doubleValue());
        forecastPriceResponse.setPrice(calc.price);
        forecastPriceResponse.setCityCode(cityCode);
        forecastPriceResponse.setVehicleType(vehicleType);
        forecastPriceResponse.setFareType(priceRule.getFareType());
        forecastPriceResponse.setFareVersion(priceRule.getFareVersion());
        return Result.ok(forecastPriceResponse);
    }

    private PriceCalcResult getPrice(Integer distance, Integer duration, PriceRule priceRule) {
        BigDecimal price = BigDecimal.ZERO;
        // 起步价
        price = BigDecimalUtils.add(price, priceRule.getStartFare());

        // 里程费：总里程 km
        BigDecimal distanceMile = BigDecimalUtils.divide(distance, 1000);
        BigDecimal startMile = BigDecimal.valueOf(priceRule.getStartMile());
        BigDecimal distanceSubtract = BigDecimalUtils.substract(distanceMile, startMile);
        BigDecimal mile = distanceSubtract.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : distanceSubtract;
        BigDecimal mileFare = BigDecimalUtils.multiply(mile, priceRule.getUnitPricePerMile());
        price = BigDecimalUtils.add(price, mileFare);

        // 时长费：分钟
        BigDecimal timeMinute = BigDecimalUtils.divide(duration, 60);
        BigDecimal timeFare = BigDecimalUtils.multiply(timeMinute, priceRule.getUnitPricePerMinute());
        price = BigDecimalUtils.add(price, timeFare);

        PriceCalcResult result = new PriceCalcResult();
        result.distanceMile = distanceMile;
        result.timeMinute = timeMinute;
        result.price = BigDecimalUtils.money(price);
        return result;
    }

    public Result calculatePrice(Integer distance, Integer duration, String cityCode, String vehicleType) {
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");
        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (ObjectUtils.isEmpty(priceRules)) {
            return Result.fail(ResultCodeEnum.PRICE_RULE_EMPTY);
        }

        PriceRule priceRule = priceRules.get(0);
        BigDecimal price = getPrice(distance, duration, priceRule).price;
        return Result.ok(price);
    }

    private static class PriceCalcResult {
        private BigDecimal price;
        private BigDecimal distanceMile;
        private BigDecimal timeMinute;
    }
}
