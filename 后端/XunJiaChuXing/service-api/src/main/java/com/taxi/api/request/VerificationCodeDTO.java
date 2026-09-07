package com.taxi.api.request;

import com.taxi.api.validation.ValidationGroups;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Data
public class VerificationCodeDTO {

    @NotBlank(groups = {ValidationGroups.PassengerSend.class, ValidationGroups.PassengerCheck.class},
            message = "乘客手机号不能为空")
    @Pattern(groups = {ValidationGroups.PassengerSend.class, ValidationGroups.PassengerCheck.class},
            regexp = "^1[3-9]\\d{9}$", message = "乘客手机号格式不正确")
    private String passengerPhone;

    @NotBlank(groups = {ValidationGroups.PassengerCheck.class, ValidationGroups.DriverCheck.class},
            message = "验证码不能为空")
    private String verificationCode;

    @NotBlank(groups = {ValidationGroups.DriverSend.class, ValidationGroups.DriverCheck.class},
            message = "司机手机号不能为空")
    @Pattern(groups = {ValidationGroups.DriverSend.class, ValidationGroups.DriverCheck.class},
            regexp = "^1[3-9]\\d{9}$", message = "司机手机号格式不正确")
    private String driverPhone;
}
