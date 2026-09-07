package com.taxi.driverUser.vo;

import lombok.Data;

/**
 * 当前运营区域下可申请绑定/换绑的车辆
 */
@Data
public class BindableCarVO {
    private Long id;
    private String vehicleNo;
    private String vehicleType;
    private String vehicleTypeName;
    private String brand;
    private String model;
}
