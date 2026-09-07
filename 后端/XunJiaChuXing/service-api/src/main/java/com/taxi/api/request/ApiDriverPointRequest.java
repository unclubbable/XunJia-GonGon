package com.taxi.api.request;

import com.taxi.api.response.PointDTO;
import lombok.Data;


@Data
public class ApiDriverPointRequest {
    private Long orderId;
    private Long carId;
    private PointDTO[] points;
}
