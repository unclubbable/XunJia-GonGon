package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

@Data
public class OrderDetailInfo implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 订单ID
     */
    private Long id;

    /**
     * 乘客ID
     */
    private Long passengerId;

    /**
     * 乘客手机号
     */
    private String passengerPhone;

    /**
     * 乘客姓
     */
    private String passengerSurname;

    /**
     * 司机ID
     */
    private Long driverId;

    /**
     * 司机姓
     */
    private String driverSurname;

    /**
     * 司机手机号
     */
    private String driverPhone;

    /**
     * 司机完成总单数
     */
    private Integer driverTotalOrders;

    /**
     * 车辆Id
     */
    private Long carId;

    /**
     * 车辆品牌
     */
    private String vehicleBrand;

    /**
     * 车辆型号
     */
    private String vehicleModel;

    /**
     * 车辆颜色
     */
    private String vehicleColor;

    /**
     * 发起地行政区划代码
     */
    private String address;

    /**
     * 车辆类型
     */
    private String vehicleType;

    /**
     * 订单发起时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date orderTime;

    /**
     * 预计用车时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date departTime;

    /**
     * 预计出发地点详细地址
     */
    private String departure;

    /**
     * 预计出发地点经度
     */
    private String depLongitude;

    /**
     * 预计出发地点纬度
     */
    private String depLatitude;

    /**
     * 预计目的地
     */
    private String destination;

    /**
     * 预计目的地经度
     */
    private String destLongitude;

    /**
     * 预计目的地纬度
     */
    private String destLatitude;

    /**
     * 坐标加密标识	1:GCJ-02测绘局标准	2:WGS84 GPS标准	3:BD-09 百度标准	4:CGCS2000 北斗标准	0:其他
     */
    private Integer encrypt;

    /**
     * 运价类型编码
     */
    private String fareType;
    /**
     * 运价版本
     */
    private Integer fareVersion;

    /**
     * 接单时车辆经度
     */
    private String receiveOrderCarLongitude;

    /**
     * 接单时车辆纬度
     */
    private String receiveOrderCarLatitude;

    /**
     * 接单时间，派单成功时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime receiveOrderTime;

    /**
     * 机动车驾驶证号
     */
    private String licenseId;

    /**
     * 车辆号牌
     */
    private String vehicleNo;

    /**
     * 司机去接乘客出发时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime toPickUpPassengerTime;

    /**
     * 去接乘客时，司机的经度
     */
    private String toPickUpPassengerLongitude;

    /**
     * 去接乘客时，司机的纬度
     */
    private String toPickUpPassengerLatitude;

    /**
     * 去接乘客时，司机的地点
     */
    private String toPickUpPassengerAddress;

    /**
     * 司机到达上车点时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime driverArrivedDepartureTime;

    /**
     * 接到乘客，乘客上车时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime pickUpPassengerTime;

    /**
     * 接到乘客，乘客上车经度
     */
    private String pickUpPassengerLongitude;

    /**
     * 接到乘客，乘客上车纬度
     */
    private String pickUpPassengerLatitude;

    /**
     * 乘客下车时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime passengerGetoffTime;

    /**
     * 乘客下车经度
     */
    private String passengerGetoffLongitude;

    /**
     * 乘客下车纬度
     */
    private String passengerGetoffLatitude;

    /**
     * 订单撤销时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime cancelTime;

    /**
     * 撤销发起者：1:乘客	2:驾驶员	3:平台公司
     */
    private Integer cancelOperator;

    /**
     * 撤销类型代码	1:乘客提前撤销	2:驾驶员提前撤销	3:平台公司撤销	4;乘客违约撤销	5:驾驶员违约撤销
     */
    private Integer cancelTypeCode;

    /**
     * 载客里程（米）
     */
    private Long driveMile;

    /**
     * 载客时间(分)
     */
    private Long driveTime;

    /**
     * 订单状态1：订单开始 2：司机接单 3：去接乘客 4：司机到达乘客起点 5：乘客上车，司机开始行程 6：到达目的地，行程结束，未支付 7：发起收款 8: 支付完成 9.订单取消'
     */
    private Integer orderStatus;

    /**
     * 价格
     */
    private Double price;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtCreate;

    /**
     * 修改时间
     */
    @TableField(fill=FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtModified;
}
