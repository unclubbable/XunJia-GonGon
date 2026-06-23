package com.taxi.api.response;

import lombok.Data;


@Data
public class DriverUserExistsResponse {
    private String driverPhone;

    private int ifExists;
}
