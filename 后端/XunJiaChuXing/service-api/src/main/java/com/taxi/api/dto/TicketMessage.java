package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 工单消息
 */
@Data
@TableName("ticket_message")
public class TicketMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long ticketId;

    /** 1乘客 2司机 3运营 4系统 */
    private Integer senderType;

    private Long senderId;

    private String senderName;

    private String content;

    /** 1文本 2系统事件 */
    private Integer msgType;

    /** HUMAN / AI_ASSISTED */
    private String contentSource;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date gmtCreate;
}
