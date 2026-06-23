package com.taxi.api.dto;

import lombok.Data;


@Data
public class DicDistrict {
    private String addressCode; // 地区编码
    private String addressName; // 地区名称
    private String parentAddressCode; // 父地区编码
    private Integer level; // 级别
}
