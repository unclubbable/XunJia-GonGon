package com.taxi.price.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.taxi.api.dto.PriceRule;
import com.taxi.api.result.Result;
import com.taxi.price.mapper.PriceRuleMapper;
import com.taxi.price.vo.PriceRuleBatchAddRequest;
import com.taxi.price.vo.PriceRuleCityVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
public class PriceRuleService {
    @Autowired
    private PriceRuleMapper priceRuleMapper;

    /**
     * 按城市分页返回计价规则；每个城市下按车型去重，仅保留最新版本。
     */
    public Result getRulesList(int page, int limit, String cityCode) {
        QueryWrapper<PriceRule> cityWrapper = new QueryWrapper<>();
        cityWrapper.select("city_code");
        if (StringUtils.isNotEmpty(cityCode)) {
            cityWrapper.eq("city_code", cityCode);
        }
        cityWrapper.groupBy("city_code");
        cityWrapper.orderByAsc("city_code");
        List<String> cityCodes = priceRuleMapper.selectList(cityWrapper).stream()
                .map(PriceRule::getCityCode)
                .filter(StringUtils::isNotEmpty)
                .distinct()
                .collect(Collectors.toList());

        int total = cityCodes.size();
        int fromIndex = Math.min(Math.max((page - 1) * limit, 0), total);
        int toIndex = Math.min(fromIndex + limit, total);
        List<String> pageCities = cityCodes.subList(fromIndex, toIndex);

        List<PriceRuleCityVO> items = new ArrayList<>();
        for (String code : pageCities) {
            PriceRuleCityVO vo = new PriceRuleCityVO();
            vo.setCityCode(code);
            vo.setRules(listLatestRulesByCity(code));
            items.add(vo);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("items", items);
        data.put("total", total);
        return Result.ok(data);
    }

    /**
     * 查询某城市下各车型最新计价规则
     */
    public List<PriceRule> listLatestRulesByCity(String cityCode) {
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.orderByDesc("fare_version");
        List<PriceRule> all = priceRuleMapper.selectList(wrapper);
        Map<String, PriceRule> latestByType = new LinkedHashMap<>();
        for (PriceRule rule : all) {
            latestByType.putIfAbsent(rule.getVehicleType(), rule);
        }
        return new ArrayList<>(latestByType.values());
    }

    /**
     * 添加计价规则，版本为 1
     */
    public Result add(PriceRule priceRule) {
        String cityCode = priceRule.getCityCode();
        String vehicleType = priceRule.getVehicleType();
        String fareType = cityCode + "$" + vehicleType;
        priceRule.setFareType(fareType);

        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");

        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (priceRules.size() > 0) {
            return Result.fail().message("计价规则存在,请勿重复添加");
        }
        priceRule.setFareVersion(1);

        priceRuleMapper.insert(priceRule);
        return Result.ok();
    }

    /**
     * 同一城市批量新增各车型规则，内部复用 {@link #add(PriceRule)}
     */
    @Transactional(rollbackFor = Exception.class)
    public Result addBatch(PriceRuleBatchAddRequest request) {
        if (request == null || StringUtils.isEmpty(request.getCityCode())) {
            return Result.fail().message("请选择城市");
        }
        List<PriceRule> rules = request.getRules();
        if (rules == null || rules.isEmpty()) {
            return Result.fail().message("请至少配置一种车辆类型的计价规则");
        }
        String cityCode = request.getCityCode();
        for (PriceRule rule : rules) {
            if (rule == null || StringUtils.isEmpty(rule.getVehicleType())) {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                return Result.fail().message("车辆类型不能为空");
            }
            rule.setCityCode(cityCode);
            Result result = add(rule);
            if (!result.isOk()) {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                String detail = result.getMessage() != null ? result.getMessage() : "新增失败";
                return Result.fail().message(detail + "（车型：" + rule.getVehicleType() + "）");
            }
        }
        return Result.ok();
    }

    /**
     * 编辑计价规则，版本 + 1
     */
    public Result edit(PriceRule priceRule) {
        String cityCode = priceRule.getCityCode();
        String vehicleType = priceRule.getVehicleType();
        String fareType = cityCode + "$" + vehicleType;
        priceRule.setFareType(fareType);

        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");

        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (priceRules == null || priceRules.isEmpty()) {
            return Result.fail().message("计价规则不存在");
        }

        PriceRule lasterPriceRule = priceRules.get(0);
        Double unitPricePerMile = lasterPriceRule.getUnitPricePerMile();
        Double unitPricePerMinute = lasterPriceRule.getUnitPricePerMinute();
        Double startFare = lasterPriceRule.getStartFare();
        Integer startMile = lasterPriceRule.getStartMile();
        if (unitPricePerMile.doubleValue() == priceRule.getUnitPricePerMile().doubleValue()
                && unitPricePerMinute.doubleValue() == priceRule.getUnitPricePerMinute().doubleValue()
                && startFare.doubleValue() == priceRule.getStartFare().doubleValue()
                && startMile.doubleValue() == priceRule.getStartMile().doubleValue()) {
            return Result.fail().message("计价规则未变更,请勿重复提交");
        }

        Integer fareVersion = lasterPriceRule.getFareVersion();
        lasterPriceRule = priceRule;
        lasterPriceRule.setFareVersion(++fareVersion);

        priceRuleMapper.insert(lasterPriceRule);
        return Result.ok();
    }

    public Result getNewestVersion(String fareType) {
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("fare_type", fareType);
        wrapper.orderByDesc("fare_version");
        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (priceRules.size() <= 0) {
            return Result.fail().message("计价规则不存在");
        }
        return Result.ok(priceRules.get(0));
    }

    public Result isNew(String fareType, int fareVersion) {
        Result<PriceRule> newestVersion = getNewestVersion(fareType);
        if (newestVersion.getMessage().equals("计价规则不存在")) {
            return Result.fail(false).message(newestVersion.getMessage());
        }
        PriceRule priceRule = newestVersion.getData();
        Integer fareVersionDB = priceRule.getFareVersion();
        if (fareVersionDB > fareVersion) {
            return Result.ok(false);
        } else {
            return Result.ok(true);
        }
    }

    public Result ifExists(String cityCode, String vehicleType) {
        if (StringUtils.isEmpty(cityCode) || StringUtils.isEmpty(vehicleType)) {
            return Result.ok(false);
        }
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode.trim());
        wrapper.eq("vehicle_type", vehicleType.trim());
        wrapper.orderByDesc("fare_version");

        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if (priceRules.size() > 0) {
            return Result.ok(true);
        }
        return Result.ok(false);
    }

    /**
     * 某车型在计价表中已配置的城市编码（去重、升序）
     */
    public List<String> listCityCodesByVehicleType(String vehicleType) {
        if (StringUtils.isEmpty(vehicleType)) {
            return new ArrayList<>();
        }
        String type = vehicleType.trim();
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("vehicle_type", type);
        wrapper.orderByAsc("city_code");
        return priceRuleMapper.selectList(wrapper).stream()
                .map(PriceRule::getCityCode)
                .filter(StringUtils::isNotEmpty)
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * 某城市在计价表中已配置的车型编码（去重）
     */
    public List<String> listVehicleTypesByCity(String cityCode) {
        if (StringUtils.isEmpty(cityCode)) {
            return new ArrayList<>();
        }
        String code = cityCode.trim();
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", code);
        wrapper.orderByAsc("vehicle_type");
        return priceRuleMapper.selectList(wrapper).stream()
                .map(PriceRule::getVehicleType)
                .filter(StringUtils::isNotEmpty)
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
}
