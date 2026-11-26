package com.xunjia.map.controller;

import com.xunjia.api.response.TrackResponse;
import com.xunjia.api.result.Result;
import com.xunjia.map.service.TrackService;
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
