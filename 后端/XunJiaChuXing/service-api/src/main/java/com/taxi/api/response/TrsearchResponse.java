package com.taxi.api.response;

import lombok.Data;


@Data
public class TrsearchResponse {
    //开车距离
    private Long driveMile;
    //开车时间
    private Long driveTime;
}
