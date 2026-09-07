package com.taxi.driverUser.vo;

import lombok.Data;

import java.util.List;

/**
 * 可运营/可切换城市查询结果（供前端展示与排查）
 */
@Data
public class OperableCitiesResponse {
    /** 当前绑定车辆车型编码 */
    private String vehicleType;
    /** 车型名称 */
    private String vehicleTypeName;
    /** 司机当前运营城市编码 */
    private String currentCityCode;
    /** 计价表中支持该车型的全部城市 */
    private List<OperableCityVO> cities;
}
