package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

import java.util.Date;

@Data
public class PassengerUser {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    private String passengerPhone;
    private String passengerSurname;
    private String passengerName;
    private Integer passengerGender;
    private Integer state;
    @TableField(fill = FieldFill.INSERT)
    private Date gmtCreate;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date gmtModified;

    private String profilePhoto;
}
