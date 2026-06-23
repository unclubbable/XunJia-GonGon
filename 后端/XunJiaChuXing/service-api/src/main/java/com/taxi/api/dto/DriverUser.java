package com.taxi.api.dto;

/**
 * 网约车司机类
 */
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

import java.time.LocalDate;
import java.util.Date;

@Data
public class DriverUser {
    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 司机运营地行政区划代码
     */
    private String address;

    /**
     * 司机姓
     */
    private String driverSurname;
    /**
     * 司机姓名
     */
    private String driverName;

    /**
     * 司机手机号
     */
    private String driverPhone;

    /**
     * 司机性别（1:男，2:女）
     */
    private Integer driverGender;

    /**
     * 司机出生日期
     */
    private LocalDate driverBirthday;

    /**
     * 驾驶员民族
     */
    private String driverNation;
    /**
     * 司机完单总数
     */
    private Integer totalOrders;
    /**
     * 驾驶员联系地址
     */
    private String driverContactAddress;

    /**
     * 机动车驾驶证号
     */
    private String licenseId;

    /**
     * 初次领取驾驶证日期
     */
    private LocalDate getDriverLicenseDate;

    /**
     * 驾驶证有效期起始日期
     */
    private LocalDate driverLicenseOn;

    /**
     * 驾驶证有效期截止日期
     */
    private LocalDate driverLicenseOff;

    /**
     * 是否巡游出租汽车（1:是，0:否）
     */
    private Integer taxiDriver;

    /**
     * 网络预约出租汽车驾驶员资格证号
     */
    private String certificateNo;

    /**
     * 网络预约出租汽车驾驶员发证机构
     */
    private String networkCarIssueOrganization;

    /**
     * 资格证发证日期
     */
    private LocalDate networkCarIssueDate;

    /**
     * 初次领取资格证日期
     */
    private LocalDate getNetworkCarProofDate;

    /**
     * 资格证有效起始日期
     */
    private LocalDate networkCarProofOn;

    /**
     * 资格证有效截止日期
     */
    private LocalDate networkCarProofOff;

    /**
     * 报备日期
     */
    private LocalDate registerDate;

    /**
     * 服务类型（1:网络预约出租汽车，2:巡游出租汽车，3:私人小客车合乘）
     */
    private Integer commercialType;

    /**
     * 驾驶员合同（协议）签署公司
     */
    private String contractCompany;

    /**
     * 合同（协议）有效期起始日期
     */
    private LocalDate contractOn;

    /**
     * 合同（协议）有效期截止日期
     */
    private LocalDate contractOff;

    /**
     * 司机状态（0:有效，1:失效）
     */
    private Integer state;

    @TableField(fill = FieldFill.INSERT)
    private Date gmtCreate;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date gmtModified;
}
