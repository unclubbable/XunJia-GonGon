package com.taxi.api.response;

import lombok.Data;

@Data
public class TerminalSearchResponse {
    // 终端ID
    private String tid;
    // 车牌号
    private String vehicleNo;
    //定位时间戳(如果为0，则该终端从创建到现在没有上线)
    private String locatetime;
    // 位置信息
    private Locatetion location;
}
