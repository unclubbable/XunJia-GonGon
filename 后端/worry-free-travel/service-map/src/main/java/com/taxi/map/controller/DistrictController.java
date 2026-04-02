package com.taxi.map.controller;

import com.taxi.api.result.Result;
import com.taxi.map.service.DistrictService;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.apache.ibatis.annotations.Delete;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class DistrictController {
    @Autowired
    private DistrictService districtService;


    @ApiOperation("高德api拉取地区信息，更新本地字典(输入中国,更新中国及下级省.输入山东,更新下级市)")
    @ApiImplicitParam(name = "keywords",value = "关键词(行政区名称、citycode、adcode)",required = true)
    @GetMapping("/dic-district/{keywords}")
    public Result initDicDistrict(@PathVariable String keywords){
        return districtService.initDicDistrict(keywords);
    }

    @ApiOperation("高德api拉取地区信息，删除本地字典(输入中国,更新中国及下级省.输入山东,更新下级市)")
    @ApiImplicitParam(name = "keywords",value = "关键词(行政区名称、citycode、adcode)",required = true)
    @DeleteMapping("/dic-district/{keywords}")
    public Result deleteDicDistrict(@PathVariable String keywords){
        return districtService.DeleteDicDistrict(keywords);
    }

    @ApiOperation("本地获取省,市级地区字典信息")
    @GetMapping("/dic-district/list")
    public Result listDicDistrict(){
        return districtService.listDicDistrict();
    }
    @ApiOperation("从高德中获取中国全部的省区")
    @GetMapping("/dic-district/listprovince")
    public Result listprovinceDicDistrict(){
        return districtService.listprovinceDicDistrict();
    }

    @ApiOperation("本地获取市级地区字典信息")
    @GetMapping("/district")
    public Result getDistrictInfo(){
        return districtService.getDistrictInfo();
    }
}
