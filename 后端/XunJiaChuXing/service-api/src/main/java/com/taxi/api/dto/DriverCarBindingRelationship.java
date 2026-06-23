package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

import java.time.LocalDateTime;


@Data
public class DriverCarBindingRelationship {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long driverId;

    private Long carId;

    private String vehicleNo;  // 车牌号

    private Integer bindState;  // 1 绑定 2 解绑

    private LocalDateTime bindingTime;

    private LocalDateTime unBindingTime;
}
