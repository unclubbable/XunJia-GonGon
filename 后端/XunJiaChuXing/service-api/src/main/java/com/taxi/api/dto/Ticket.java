package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 工单主表
 */
@Data
@TableName("ticket")
public class Ticket implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private String ticketNo;

    /** 1乘客 2司机 */
    private Integer source;

    private String category;

    private String title;

    private String content;

    private String status;

    private Integer priority;

    private Long orderId;

    private Long passengerId;

    private String passengerPhone;

    private Long driverId;

    private String driverPhone;

    /** JSON 字符串 */
    private String requestPayload;

    private Integer assigneeId;

    private String assigneeName;

    private String resultSummary;

    private String rejectReason;

    private Long refundId;

    private String aiSummary;

    private String aiSuggestionJson;

    @Version
    private Integer version;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtCreate;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtModified;
}
