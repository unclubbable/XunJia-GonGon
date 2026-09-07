package com.taxi.api.validation;

/**
 * Bean Validation 分组，用于同一 DTO 在不同接口下的差异化校验
 */
public final class ValidationGroups {

    private ValidationGroups() {}

    /** 乘客端 - 发送验证码 */
    public interface PassengerSend {}

    /** 乘客端 - 校验验证码 */
    public interface PassengerCheck {}

    /** 司机端 - 发送验证码 */
    public interface DriverSend {}

    /** 司机端 - 校验验证码 */
    public interface DriverCheck {}

    /** 创建订单 */
    public interface OrderCreate {}

    /** 需要订单 ID 的操作 */
    public interface OrderIdRequired {}
}
