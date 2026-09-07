package com.taxi.api.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 轨迹点（经纬度拆分后的结构，便于管理端画线 / 后续 AI 分析）。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackPointDTO {

    /** 经度 */
    private String longitude;

    /** 纬度 */
    private String latitude;

    /**
     * 定位时间戳（毫秒）。
     * 高德部分纠偏场景下可能为空，允许为 null。
     */
    private Long locateTime;
}
