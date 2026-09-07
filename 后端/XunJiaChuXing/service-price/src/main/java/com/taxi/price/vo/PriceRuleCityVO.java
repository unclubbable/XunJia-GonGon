package com.taxi.price.vo;

import com.taxi.api.dto.PriceRule;
import lombok.Data;

import java.util.List;

/**
 * 按城市聚合的计价规则（每个车型仅含最新版本）
 */
@Data
public class PriceRuleCityVO {
    private String cityCode;
    private List<PriceRule> rules;
}
