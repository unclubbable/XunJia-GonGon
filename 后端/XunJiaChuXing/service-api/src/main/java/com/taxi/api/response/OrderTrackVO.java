package com.taxi.api.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 乘客/司机端订单轨迹回放。
 * <p>
 * 包含高德实际上报点 + 订单关键节点坐标，供前端按管理端同款逻辑画线；
 * 不暴露车辆 tid。
 */
@Data
public class OrderTrackVO {

    /** 高德轨迹点（已抽稀） */
    private List<TrackPointDTO> points = new ArrayList<>();

    private Long driveMile;
    private Long driveTime;
    private Integer rawPointCount;
    private Integer pointCount;
    private Integer simplifyType;

    /** 预计出发地 */
    private String depLongitude;
    private String depLatitude;
    /** 预计目的地 */
    private String destLongitude;
    private String destLatitude;

    /** 接单时车辆位置 */
    private String receiveOrderCarLongitude;
    private String receiveOrderCarLatitude;
    /** 去接乘客出发位置 */
    private String toPickUpPassengerLongitude;
    private String toPickUpPassengerLatitude;
    /** 实际上车点 */
    private String pickUpPassengerLongitude;
    private String pickUpPassengerLatitude;
    /** 实际下车点（中途下车时与预计目的地不同） */
    private String passengerGetoffLongitude;
    private String passengerGetoffLatitude;

    /** 可读提示，如「暂无上报轨迹」 */
    private String tip;
}
