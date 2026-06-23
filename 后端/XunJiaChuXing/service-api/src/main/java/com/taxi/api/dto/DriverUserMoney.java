package com.taxi.api.dto;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

import java.io.Serializable;

@Data
public class DriverUserMoney implements Serializable {
    private static final long serialVersionUID = 1L;
    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    /**
     * 司机ID
     */
    private Long driverId;
    /**
     * 年
     */
    private Long year;
    /**
     * 月
     */
    private Long month;
    /**
     * 订单总金额（乘客实付）
     */
    private Double TotalOrderAmount;
    /**
     * 司机实际收入
     */
    private Double driverIncome;
    /**
     * 平台抽成
     */
    private Double platformCommission;
    /**
     * 工资是否发放
     */
    private Long status;

}
