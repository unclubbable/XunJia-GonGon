package com.xunjia.api.request;

import com.xunjia.api.response.PointDTO;
import lombok.Data;


@Data
public class ApiDriverPointRequest {
    private Long orderId;
    private Long carId;
    private PointDTO[] points;
}
