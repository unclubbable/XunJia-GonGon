package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;


@Data
public class DriverUserWorkStatus implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long driverId;

    /**
     * 收车：0；出车：1，暂停：2
     */
    private Integer workStatus;
    /**
     * 城市编码
     */
    private String citycode;

    /**
     * 行政区名称
     */
    private String adname;
    /**
     * 行政区编码
     */
    private String adcode;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private Date gmtCreate;

    /**
     * 修改时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date gmtModified;

}
