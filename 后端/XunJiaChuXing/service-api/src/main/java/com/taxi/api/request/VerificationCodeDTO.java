package com.taxi.api.request;

import lombok.Data;


@Data
public class VerificationCodeDTO {
    private String passengerPhone;

    private String verificationCode;

    private String driverPhone;

}
