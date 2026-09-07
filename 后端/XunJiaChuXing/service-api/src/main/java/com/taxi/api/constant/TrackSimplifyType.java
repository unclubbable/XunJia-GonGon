package com.taxi.api.constant;

/**
 * 轨迹点返回/抽稀策略。
 * <p>
 * 扩展新算法时：在此增加常量，并在 {@link com.taxi.api.util.TrackSimplifyUtils} 中增加对应分支即可。
 */
public final class TrackSimplifyType {

    private TrackSimplifyType() {
    }

    /** 全量返回（不抽稀） */
    public static final int FULL = 1;

    /** 按相邻点直线距离抽稀（单位：米） */
    public static final int BY_DISTANCE = 2;

    // ---- 预留扩展位（暂未实现，避免魔法数字散落）----
    // public static final int BY_TIME_INTERVAL = 3;
    // public static final int DOUGLAS_PEUCKER = 4;
}
