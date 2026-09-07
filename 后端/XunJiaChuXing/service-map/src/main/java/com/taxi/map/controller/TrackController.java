package com.taxi.map.controller;

import com.taxi.api.response.TrackResponse;
import com.taxi.api.result.Result;
import com.taxi.map.service.TrackService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/track")
public class TrackController {
    @Autowired
    private TrackService trackService;

    @ApiOperation("添加轨迹")
    @PostMapping("/add")
    public Result<TrackResponse> add(String tid){
        return trackService.add(tid);
    }
}
