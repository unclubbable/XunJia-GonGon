package com.taxi.controller;

import com.taxi.api.result.Result;
import com.taxi.service.TerminalService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/boss-user/Terminal")
public class TerminalController {
    @Autowired
    private TerminalService terminalService;

    @ApiOperation("根据车牌号查询终端最后位置")
    @GetMapping("/{keyword}")
    public Result searchKeyword(@PathVariable String keyword){
        return terminalService.searchKeyword(keyword);
    }

    @ApiOperation("查询所有车辆终端最后位置")
    @GetMapping()
    public Result searchKeywordList(){
        return terminalService.searchKeywordList();
    }



}
