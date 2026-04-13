package com.taxi.price.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.taxi.api.dto.PriceRule;
import com.taxi.price.mapper.PriceRuleMapper;
import com.taxi.api.result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class PriceRuleService {
    @Autowired
    private PriceRuleMapper priceRuleMapper;

    public Result getRulesList(int page,int limit,String cityCode){
        Page<PriceRule> pageObj = new Page<>(page, limit);

        // 创建LambdaQueryWrapper
        LambdaQueryWrapper<PriceRule> queryWrapper = new LambdaQueryWrapper<>();
        // 如果cityCode不为空，添加到查询条件
        if (StringUtils.isNotEmpty(cityCode)) {
            queryWrapper.eq(PriceRule::getCityCode, cityCode);
        }

        IPage<PriceRule> iPage = priceRuleMapper.selectPage(pageObj, queryWrapper);
        Map<String, Object> data = new HashMap<>();
        data.put("items", iPage.getRecords());
        data.put("total", iPage.getTotal());
        return Result.ok(data);
    }

    /**
     * 添加计价规则，版本为 1
     * @param priceRule
     * @return
     */
    public Result add(PriceRule priceRule) {
        //拼接fareType
        String cityCode = priceRule.getCityCode();
        String vehicleType = priceRule.getVehicleType();
        String fareType = cityCode + "$" + vehicleType;
        priceRule.setFareType(fareType);

        //添加版本号
        //找到最大版本号
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");

        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        Integer fareVersion = 0;
        if (priceRules.size() > 0) {
            return Result.fail("计价规则存在,请勿重复添加");
        }
        priceRule.setFareVersion(++fareVersion);

        priceRuleMapper.insert(priceRule);
        return Result.ok();
    }

    /**
     * 编辑计价规则，版本 + 1
     * @param priceRule
     * @return
     */
    public Result edit(PriceRule priceRule) {
        //拼接fareType
        String cityCode = priceRule.getCityCode();
        String vehicleType = priceRule.getVehicleType();
        String fareType = cityCode + "$" + vehicleType;
        priceRule.setFareType(fareType);

        //添加版本号
        //找到最大版本号
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code", cityCode);
        wrapper.eq("vehicle_type", vehicleType);
        wrapper.orderByDesc("fare_version");

        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);

        Integer fareVersion = 0;

        PriceRule lasterPriceRule = priceRules.get(0);
        Double unitPricePerMile = lasterPriceRule.getUnitPricePerMile();
        Double unitPricePerMinute = lasterPriceRule.getUnitPricePerMinute();
        Double startFare = lasterPriceRule.getStartFare();
        Integer startMile = lasterPriceRule.getStartMile();
        if (priceRules.size() > 0) {
            if (unitPricePerMile.doubleValue() == priceRule.getUnitPricePerMile().doubleValue()
                    && unitPricePerMinute.doubleValue() == priceRule.getUnitPricePerMinute().doubleValue()
                    && startFare.doubleValue() == priceRule.getStartFare().doubleValue()
                    && startMile.doubleValue() == priceRule.getStartMile().doubleValue()) {
                return Result.fail("计价规则存在,请勿重复添加");
            }
        }

        fareVersion = lasterPriceRule.getFareVersion();
        lasterPriceRule=priceRule;
        lasterPriceRule.setFareVersion(++fareVersion);

        priceRuleMapper.insert(lasterPriceRule);
        return Result.ok();
    }

    public Result getNewestVersion(String fareType) {
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("fare_type",fareType);
        wrapper.orderByDesc("fare_version");
        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if(priceRules.size()<=0){
            return Result.fail().message("计价规则不存在");
        }
        return Result.ok(priceRules.get(0));
    }

    public Result isNew(String fareType,int fareVersion){
        Result<PriceRule> newestVersion = getNewestVersion(fareType);
        if(newestVersion.getMessage().equals("计价规则不存在")){
            return Result.fail(false).message(newestVersion.getMessage());
        }
        PriceRule priceRule = newestVersion.getData();
        Integer fareVersionDB = priceRule.getFareVersion();
        if(fareVersionDB>fareVersion){   // 如果数据库计价规则>传入的预估的版本，说明不是最新的，预估后计价规则有更改
            return Result.ok(false);
        }{
            return Result.ok(true);
        }
    }

    public Result ifExists(String cityCode,String vehicleType) {
        QueryWrapper<PriceRule> wrapper = new QueryWrapper<>();
        wrapper.eq("city_code",cityCode);
        wrapper.eq("vehicle_type",vehicleType);
        wrapper.orderByDesc("fare_version");

        List<PriceRule> priceRules = priceRuleMapper.selectList(wrapper);
        if(priceRules.size()>0){
            return Result.ok(true);
        }
        return Result.ok(false);
    }
}
