package com.taxi.price.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.taxi.api.dto.PriceRule;
import org.apache.ibatis.annotations.Mapper;


@Mapper
public interface PriceRuleMapper extends BaseMapper<PriceRule> {
}
