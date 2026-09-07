package com.taxi.api.response;

import lombok.Data;


@Data
public class AroundsearchResponse {
    private String center;
    private Integer radius;
}
