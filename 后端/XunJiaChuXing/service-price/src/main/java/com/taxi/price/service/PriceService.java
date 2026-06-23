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
import com.taxi.common.util.BigDecimalUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;


@Service
public class PriceService {
    @Autowired
    private ServiceMapClient serviceMapClient;

    @Autowired
    private PriceRuleMapper priceRuleMapper;

    public Result forecastPrice(ForecastPriceDOT forecastPriceDOT) {
        // 远程调用地图服务获取时长和距离
        DirectionResponse direction = serviceMapClient.driving(forecastPriceDOT).getData();
        Integer distance = direction.getDistance();
        Integer duration = direction.getDuration();

        //获取城市编码和车辆类型
        String cityCode = forecastPriceDOT.getCityCode();
        String vehicleType = forecastPriceDOT.getVehicleType();

        //读取计价规则
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");
        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (ObjectUtils.isEmpty(priceRules)) {
            return Result.fail().message("当前城市无计价规则");
        }
        PriceRule priceRule = priceRules.get(0);

        HashMap<String, Double> priceInfoMap = getPrice(distance, duration, priceRule);
        double distanceMile = priceInfoMap.get("distanceMile");
        double timeMinute = priceInfoMap.get("timeMinute");
        double price = priceInfoMap.get("price");

        ForecastPriceResponse forecastPriceResponse = new ForecastPriceResponse();
        forecastPriceResponse.setTimeMinute(timeMinute);
        forecastPriceResponse.setDistanceMile(distanceMile);
        forecastPriceResponse.setPrice(price);
        forecastPriceResponse.setCityCode(cityCode);
        forecastPriceResponse.setVehicleType(vehicleType);
        // 预估时返回运价类型和版本号，用于下单时判断计价规则是否是最新的
        forecastPriceResponse.setFareType(priceRule.getFareType());
        forecastPriceResponse.setFareVersion(priceRule.getFareVersion());
        return Result.ok(forecastPriceResponse);
    }

    private HashMap<String,Double> getPrice(Integer distance, Integer duration, PriceRule priceRule) {
        HashMap<String,Double> priceInfoMap = new HashMap<String, Double>();
        double price = 0;
        // 起步价
        double startFare = priceRule.getStartFare();
        price = BigDecimalUtils.add(price,startFare);

        // 里程费
        // 总里程 km
        double distanceMile = BigDecimalUtils.divide(distance,1000);
        priceInfoMap.put("distanceMile", distanceMile);
        // 起步里程
        double startMile = (double)priceRule.getStartMile();
        double distanceSubtract = BigDecimalUtils.substract(distanceMile,startMile);
        // 最终收费的里程数 km
        double mile = distanceSubtract<0?0:distanceSubtract;
        // 计程单价 元/km
        double unitPricePerMile = priceRule.getUnitPricePerMile();
        // 里程价格
        double mileFare = BigDecimalUtils.multiply(mile,unitPricePerMile);
        price = BigDecimalUtils.add(price,mileFare);

        // 时长费
        // 时长的分钟数
        double timeMinute = BigDecimalUtils.divide(duration,60);
        priceInfoMap.put("timeMinute", timeMinute);
        // 计时单价
        double unitPricePerMinute = priceRule.getUnitPricePerMinute();

        // 时长费用
        double timeFare = BigDecimalUtils.multiply(timeMinute,unitPricePerMinute);
        price = BigDecimalUtils.add(price,timeFare);

        BigDecimal priceBigDecimal = new BigDecimal(price);
        priceBigDecimal = priceBigDecimal.setScale(2, RoundingMode.HALF_UP);
        priceInfoMap.put("price", priceBigDecimal.doubleValue());
        return priceInfoMap;
    }

    public Result calculatePrice(Integer distance, Integer duration, String cityCode, String vehicleType) {
        //读取计价规则
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");
        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (ObjectUtils.isEmpty(priceRules)) {
            return Result.fail(ResultCodeEnum.PRICE_RULE_EMPTY);
        }

        PriceRule priceRule = priceRules.get(0);

        //获取价格
        double price = getPrice(distance, duration, priceRule).get("price");
        return Result.ok(price);
    }
}
