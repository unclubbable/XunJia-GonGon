package com.taxi.api.util;

import com.taxi.api.constant.TrackSimplifyType;
import com.taxi.api.response.TrackPointDTO;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 轨迹抽稀。高德全量拉，对外再压。
 */
@Slf4j
public final class TrackSimplifyUtils {

    /** 按距离抽稀默认阈值（米） */
    public static final double DEFAULT_DISTANCE_METERS = 20.0;

    private static final double EARTH_RADIUS_METERS = 6371000.0;

    private TrackSimplifyUtils() {
    }

    /** 按策略抽稀，返回新 list */
    public static List<TrackPointDTO> simplify(List<TrackPointDTO> points,
                                               Integer simplifyType,
                                               Double distanceMeters) {
        if (points == null || points.isEmpty()) {
            return Collections.emptyList();
        }

        int type = simplifyType == null ? TrackSimplifyType.FULL : simplifyType;
        switch (type) {
            case TrackSimplifyType.FULL:
                // 全量 copy 一份
                return new ArrayList<>(points);
            case TrackSimplifyType.BY_DISTANCE:
                double threshold = (distanceMeters == null || distanceMeters <= 0)
                        ? DEFAULT_DISTANCE_METERS
                        : distanceMeters;
                return simplifyByDistance(points, threshold);
            default:
                // 未知策略当全量
                log.warn("未知轨迹抽稀策略 simplifyType={}，已降级为全量返回", type);
                return new ArrayList<>(points);
        }
    }

    /** 按距离抽稀，首尾必留 */
    public static List<TrackPointDTO> simplifyByDistance(List<TrackPointDTO> points, double thresholdMeters) {
        if (points == null || points.isEmpty()) {
            return Collections.emptyList();
        }
        if (points.size() <= 2) {
            return new ArrayList<>(points);
        }

        List<TrackPointDTO> result = new ArrayList<>();
        TrackPointDTO first = points.get(0);
        result.add(first);

        TrackPointDTO lastKept = first;
        for (int i = 1; i < points.size() - 1; i++) {
            TrackPointDTO current = points.get(i);
            Double meters = haversineMeters(lastKept, current);
            if (meters == null) {
                // 坐标坏了跳过
                continue;
            }
            if (meters >= thresholdMeters) {
                result.add(current);
                lastKept = current;
            }
        }

        // 终点必留
        TrackPointDTO last = points.get(points.size() - 1);
        if (result.get(result.size() - 1) != last) {
            result.add(last);
        }
        return result;
    }

    /** 球面距离（米），坐标解析失败返回 null */
    public static Double haversineMeters(TrackPointDTO a, TrackPointDTO b) {
        if (a == null || b == null) {
            return null;
        }
        Double lng1 = parseDouble(a.getLongitude());
        Double lat1 = parseDouble(a.getLatitude());
        Double lng2 = parseDouble(b.getLongitude());
        Double lat2 = parseDouble(b.getLatitude());
        if (lng1 == null || lat1 == null || lng2 == null || lat2 == null) {
            return null;
        }

        double radLat1 = Math.toRadians(lat1);
        double radLat2 = Math.toRadians(lat2);
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLng = Math.toRadians(lng2 - lng1);

        double sinLat = Math.sin(deltaLat / 2);
        double sinLng = Math.sin(deltaLng / 2);
        double h = sinLat * sinLat
                + Math.cos(radLat1) * Math.cos(radLat2) * sinLng * sinLng;
        return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1.0, Math.sqrt(h)));
    }

    private static Double parseDouble(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
