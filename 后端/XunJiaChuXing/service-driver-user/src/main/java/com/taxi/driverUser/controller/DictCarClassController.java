package com.taxi.driverUser.controller;

import com.taxi.api.dto.DictCarClass;
import com.taxi.api.result.Result;
import com.taxi.driverUser.service.IDictCarClassService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/driver-user")
public class DictCarClassController {

    @Autowired
    private IDictCarClassService dictCarClassService;

    @ApiOperation("分页查询车辆类型字典")
    @GetMapping("/dict-car-class/list")
    public Result getList(@RequestParam int page, @RequestParam int limit) {
        return dictCarClassService.getList(page, limit);
    }

    @ApiOperation("查询全部有效车辆类型（下拉/映射）")
    @GetMapping("/dict-car-class/all")
    public Result getAll() {
        return dictCarClassService.getAll();
    }

    @ApiOperation("新增或更新车辆类型")
    @PostMapping("/dict-car-class")
    public Result addOrUpdate(@RequestBody DictCarClass dictCarClass) {
        return dictCarClassService.addOrUpdate(dictCarClass);
    }

    @ApiOperation("删除车辆类型")
    @DeleteMapping("/dict-car-class/{id}")
    public Result delete(@PathVariable("id") Long id) {
        return dictCarClassService.removeByIdSafe(id);
    }
}
