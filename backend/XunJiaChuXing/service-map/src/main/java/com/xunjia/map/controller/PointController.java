package com.xunjia.map.controller;

import com.xunjia.api.request.ApiDriverPointRequest;
import com.xunjia.api.response.PointResponse;
import com.xunjia.api.result.Result;
import com.xunjia.map.service.PointService;
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
