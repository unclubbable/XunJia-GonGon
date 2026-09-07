package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * 订单行程过程表（与 {@link OrderInfo} 一对一）。
 * <p>
 * 存放预计起终点、接单/去接/上车/下车等时空过程字段，保持 order_info 主表精简。
 */
@Data
@TableName("order_trip")
public class OrderTrip implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 订单ID（主键，与 order_info.id 一对一）
     */
    @TableId(value = "order_id", type = IdType.INPUT)
    private Long orderId;

    /** 预计用车时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date departTime;

    /** 预计出发地点详细地址 */
    private String departure;

    /** 预计出发地点经度 */
    private String depLongitude;

    /** 预计出发地点纬度 */
    private String depLatitude;

    /** 预计目的地 */
    private String destination;

    /** 预计目的地经度 */
    private String destLongitude;

    /** 预计目的地纬度 */
    private String destLatitude;

    /** 接单时车辆经度 */
    private String receiveOrderCarLongitude;

    /** 接单时车辆纬度 */
    private String receiveOrderCarLatitude;

    /** 接单时间，派单成功时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime receiveOrderTime;

    /** 司机去接乘客出发时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime toPickUpPassengerTime;

    /** 去接乘客时，司机的经度 */
    private String toPickUpPassengerLongitude;

    /** 去接乘客时，司机的纬度 */
    private String toPickUpPassengerLatitude;

    /** 去接乘客时，司机的地点 */
    private String toPickUpPassengerAddress;

    /** 司机到达上车点时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime driverArrivedDepartureTime;

    /** 接到乘客，乘客上车时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime pickUpPassengerTime;

    /** 接到乘客，乘客上车经度 */
    private String pickUpPassengerLongitude;

    /** 接到乘客，乘客上车纬度 */
    private String pickUpPassengerLatitude;

    /** 乘客下车时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime passengerGetoffTime;

    /** 乘客下车经度 */
    private String passengerGetoffLongitude;

    /** 乘客下车纬度 */
    private String passengerGetoffLatitude;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtCreate;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtModified;
}
