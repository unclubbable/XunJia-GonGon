package com.taxi.price.vo;

import com.taxi.api.dto.PriceRule;
import lombok.Data;

import java.util.List;

/**
 * 同一城市下批量新增各车型计价规则
 */
@Data
public class PriceRuleBatchAddRequest {
    private String cityCode;
    private List<PriceRule> rules;
}
