package com.xunjia.api.response;

import com.xunjia.api.response.PointDTO;
import lombok.Data;


@Data
public class PointResponse {
    private String tid;
    private String trid;
    private PointDTO[] points;
}
