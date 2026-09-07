package com.taxi.map.controller;

import com.taxi.api.request.ApiDriverPointRequest;
import com.taxi.api.response.PointResponse;
import com.taxi.api.result.Result;
import com.taxi.map.service.PointService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/point")
public class PointController {
    @Autowired
    private PointService pointService;

    @ApiOperation("上传轨迹点")
    @PostMapping("/upload")
//    public Result upload(@RequestBody PointResponse pointResponse){
    public Result upload(@RequestBody ApiDriverPointRequest apiDriverPointRequest){
//        return pointService.upload(pointResponse);
        return pointService.upload(apiDriverPointRequest);
    }
}
