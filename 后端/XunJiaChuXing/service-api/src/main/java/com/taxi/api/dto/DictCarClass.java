package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 车辆类型字典
 */
@Data
@TableName("dict_car_class")
public class DictCarClass implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 车辆类型编码（如 1/2/3/4/9）
     */
    private String classCode;

    /**
     * 车辆类型名称（如 轿车/SUV）
     */
    private String className;

    /**
     * 排序，越小越靠前
     */
    private Integer sortOrder;

    /**
     * 状态：0 有效，1 失效
     */
    private Integer state;

    @TableField(fill = FieldFill.INSERT)
    private Date gmtCreate;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date gmtModified;
}
