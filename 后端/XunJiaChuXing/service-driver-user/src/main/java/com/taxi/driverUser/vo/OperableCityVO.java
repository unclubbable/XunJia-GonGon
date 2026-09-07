package com.taxi.driverUser.vo;

import lombok.Data;

/**
 * 司机可切换运营城市（基于计价规则 + 当前绑定车型）
 */
@Data
public class OperableCityVO {
    private String cityCode;
    private String cityName;
    /** 是否为当前运营城市 */
    private Boolean current;
    /** 是否可作为切换目标（非当前城市） */
    private Boolean switchable;
}
