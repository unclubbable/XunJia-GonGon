package com.taxi.api.request;

import lombok.Data;


@Data
public class ForecastPriceDOT {
    //城市编码
    private String cityCode;
    //车辆类型
    private String vehicleType;
    // 出发地经度
    private String depLongitude;

    // 出发地纬度
    private String depLatitude;

    // 目的地经度
    private String destLongitude;

    // 目的地纬度
    private String destLatitude;
}
