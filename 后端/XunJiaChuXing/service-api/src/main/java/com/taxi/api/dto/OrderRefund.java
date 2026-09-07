package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 订单退款单
 */
@Data
@TableName("order_refund")
public class OrderRefund implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private String refundNo;

    private Long ticketId;

    private Long orderId;

    private String payOrderId;

    private Long passengerId;

    private String passengerPhone;

    private Long driverId;

    private BigDecimal orderPrice;

    private BigDecimal refundAmount;

    private String reasonCode;

    private String reasonText;

    private String status;

    /** MANUAL / ALIPAY */
    private String refundChannel;

    /** 手动退款凭证 */
    private String voucherNo;

    private Integer operatorId;

    private String operatorName;

    private String alipayRefundNo;

    /** 是否已回退司机收入：0否 1是 */
    private Integer driverSettled;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date refundedAt;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtCreate;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtModified;
}
