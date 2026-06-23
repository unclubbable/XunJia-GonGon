package com.taxi.api.response;

import lombok.Data;


@Data
public class TerminalResponse {
    // 终端ID
    private String tid;
    // 车牌号
    private String vehicleNo;
    //经度
    private String longitude;
    //纬度
    private String latitude;
}
