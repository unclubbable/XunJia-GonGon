package com.taxi.api.result;

import lombok.Getter;

/**
 * 统一返回结果状态信息类
 * enum:枚举类
 */
@Getter
public enum ResultCodeEnum {

    /**
     * 验证码错误提示：1000-1099
     */
    CALL_USER_ADD_ERROR(1000,"调用新增用户异常"),

    CHECK_CODE_ERROR(1001,"验证手机号和验证码 异常"),

    VERIFICATION_CODE_ERROR(1099,"验证码不正确"),



    /**
     * Token类提示：1100-1199
     */
    TOKEN_ERROR(1199,"token错误"),

    TOKEN_IDENTITY_MISMATCH(1198,"身份与访问路径不匹配"),

    /**
     * 用户提示：1200-1299
     */
    USER_NOT_EXISTS(1200,"当前用户不存在"),

    UPDATE_USER_ERROR(1201,"更新用户信息失败"),

    UPLOAD_ERROR(1202,"文件上传失败"),
    /**
     * 计价规则:1300-1399
     */
    PRICE_RULE_EMPTY(1300,"计价规则不存在"),

    PRICE_RULE_EXISTS(1301,"计价规则已存在，不允许添加"),

    PRICE_RULE_NOT_EDIT(1302,"计价规则没有变化"),

    PRICE_RULE_CHANGED(1303,"计价规则有变化"),

    PRICE_RULE_OUTDATED(1304,"计价规则不是最新的，请重新预估"),
    /**
     * 地图信息：1400-1499
     */
    MAP_DISTRICT_ERROR(1400,"请求地图错误"),

    TRACK_DATA_EMPTY(1410,"该时段无轨迹数据，请确认行程中已上报位置"),

    /**
     * 司机和车辆：1500-1599
     */
    DRIVER_CAR_BIND_NOT_EXISTS(1500,"司机和车辆绑定关系不存在"),

    DRIVER_NOT_EXITST(1501,"司机不存在"),

    DRIVER_CAR_BIND_EXISTS(1502,"司机和车辆绑定关系已存在，请勿重复绑定"),

    DRIVER_BIND_EXISTS(1503,"司机已经被绑定了，请勿重复绑定"),

    CAR_BIND_EXISTS(1504,"车辆已经被绑定了，请勿重复绑定"),

    CITY_DRIVER_EMPTY(1505,"当前城市没有可用的司机"),

    AVAILABLE_DRIVER_EMPTY(1506,"可用的司机为空"),

    CAR_NOT_EXISTS(1507,"车辆不存在"),

    DRIVER_STATUS_UPDATE_ERROR(1508,"司机工作状态修改失败"),

    DRIVER_NOT_WORKING(1509,"该司机未出车"),

    DRIVER_CAR_NOT_BOUND(1510,"该车辆未绑定司机"),

    DRIVER_CITY_MISMATCH(1511,"当前位置与运营城市不一致"),

    DRIVER_CITY_NOT_SET(1512,"未设置运营城市，请联系管理员"),
    /**
     * 订单：1600-1699
     */
    ORDER_GOING_ON(1600,"有正在进行的订单"),

    /**
     * 下单异常
     */
    DEVICE_IS_BLACK(1601,"该设备超过下单次数"),

    CITY_SERVICE_NOT_SERVICE(1602,"当前城市不提供叫车服务"),

    ORDER_CANCEL_ERROR(1603, "订单取消失败"),

    ORDER_NOT_EXISTS(1604,"订单不存在"),

    ORDER_CAN_NOT_GRAB(1605 , "订单不能被抢"),

    ORDER_GRABING(1606,"订单正在被抢"),

    ORDER_UPDATE_ERROR(1607,"订单修改失败"),

    DISPATCH_FAILED(1608,"未能找到可用司机"),

    ORDER_STATUS_ERROR(1609,"订单状态不正确，无法执行此操作"),

    ORDER_NO_PERMISSION(1610,"无权查看该订单轨迹"),
    /**
     * 统一验证提示 1700-1799
     */
    VALIDATION_EXCEPTION(1700,"参数校验失败"),

    PARAM_ERROR(1701,"参数错误"),

    /**
     * 系统内部错误
     */
    INTERNAL_ERROR(1800,"系统内部错误，请稍后重试"),

    /**
     * 工单：1900-1999
     */
    TICKET_NOT_EXISTS(1900, "工单不存在"),
    TICKET_CATEGORY_INVALID(1901, "工单类型不合法"),
    TICKET_STATUS_ERROR(1902, "工单状态不允许此操作"),
    TICKET_NO_PERMISSION(1903, "无权操作该工单"),
    TICKET_DUPLICATE(1904, "已存在处理中的同类工单，请勿重复提交"),
    TICKET_ORDER_REQUIRED(1905, "该类型工单必须关联订单"),
    TICKET_ORDER_MISMATCH(1906, "订单与当前用户不匹配"),
    TICKET_PAYLOAD_REQUIRED(1907, "申请内容不完整"),
    TICKET_CONFLICT(1908, "工单已被他人更新，请刷新后重试"),
    TICKET_REFUND_EXISTS(1909, "该订单已有未完结退款单"),
    TICKET_REFUND_AMOUNT_ERROR(1910, "退款金额不合法"),
    TICKET_REFUND_ORDER_STATUS_ERROR(1911, "仅已支付订单可登记退款"),
    TICKET_EXECUTE_CHANGE_ERROR(1912, "执行资料/城市变更失败"),
    TICKET_AI_NOT_READY(1913, "AI协查尚未开通"),
    AI_AGENT_UNAVAILABLE(1914, "AI服务暂时不可用"),
    AI_CONVERSATION_ERROR(1915, "AI会话处理失败"),

    /**
     * 成功
     */
    SUCCESS(1,"success"),
    /**
     * 失败
     */
    FAIL(0,"操作失败")
    ;

    private Integer code;
    private String message;

    private ResultCodeEnum(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
