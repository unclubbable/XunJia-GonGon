package com.taxi.api.response;

import com.taxi.api.response.PointDTO;
import lombok.Data;


@Data
public class PointResponse {
    private String tid;
    private String trid;
    private PointDTO[] points;
}
