package com.xunjia.api.dto;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

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
    private BigDecimal TotalOrderAmount;
    /**
     * 司机实际收入
     */
    private BigDecimal driverIncome;
    /**
     * 平台抽成
     */
    private BigDecimal platformCommission;
    /**
     * 工资是否发放
     */
    private Long status;

}
