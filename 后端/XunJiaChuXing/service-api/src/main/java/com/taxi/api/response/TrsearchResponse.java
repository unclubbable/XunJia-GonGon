package com.taxi.api.response;

import lombok.Data;

import java.util.List;

/**
 * 终端轨迹查询结果。
 * <p>
 * 计价场景通常只关心 {@link #driveMile}/{@link #driveTime}；
 * 管理端画线关注 {@link #points}。
 */
@Data
public class TrsearchResponse {

    /** 行驶里程（米），来自高德轨迹 distance 累加 */
    private Long driveMile;

    /** 行驶时长（分钟），来自高德轨迹 time 累加后换算 */
    private Long driveTime;

    /**
     * 对外返回的轨迹点（可能已按策略抽稀）。
     * needPoints=false 时为 null 或空列表。
     */
    private List<TrackPointDTO> points;

    /** 高德拉全后、抽稀前的原始点数 */
    private Integer rawPointCount;

    /** 对外返回的点数（抽稀后） */
    private Integer pointCount;

    /**
     * 实际应用的抽稀策略：
     * 1=全量，2=按距离抽稀。见 {@link com.taxi.api.constant.TrackSimplifyType}
     */
    private Integer simplifyType;
}
