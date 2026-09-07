package com.taxi.api.response;

import lombok.Data;


@Data
public class ForecastPriceResponse {
    //城市编码
    private String cityCode;
    //车辆类型
    private String vehicleType;
    //时长
    private double timeMinute;
    //距离
    private double distanceMile;
    //价格
    private double price;

    /**
     * 版本，默认1，修改往上增。
     */
    private Integer fareVersion;

    /**
     * 运价类型编码
     */
    private String fareType;
}
