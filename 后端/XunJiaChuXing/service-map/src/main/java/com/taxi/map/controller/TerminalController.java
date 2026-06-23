package com.taxi.map.controller;

import com.taxi.api.response.AroundsearchResponse;
import com.taxi.api.response.PointResponse;
import com.taxi.api.response.TerminalSearchResponse;
import com.taxi.api.result.Result;
import com.taxi.map.service.TerminalService;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/terminal")
public class TerminalController {
    @Autowired
    private TerminalService terminalService;


    @ApiOperation("创建终端")
    @PostMapping("/add")
    public Result addTerminal(@RequestParam("name") String name,@RequestParam(value = "desc",required = false)String desc){
        return terminalService.add(name,desc);
    }
    @ApiOperation("查询所有终端信息")
    @PostMapping("/query")
    public Result queryTerminal(){
        return terminalService.query();
    }
    @ApiOperation("删除终端")
    @PostMapping("/delete")
    public Result deleteTerminal(@RequestParam("tid") String tid){
        return terminalService.delete(tid);
    }

    @ApiOperation("周边搜索")
    @PostMapping("/aroundsearch")
    public Result aroundsearch(@RequestBody AroundsearchResponse aroundsearchResponse){
        return terminalService.aroundsearch(aroundsearchResponse);
    }

    @ApiOperation("轨迹查询")
    @PostMapping("/trsearch")
    public Result trsearch(@RequestParam String tid,@RequestParam Long starttime,@RequestParam Long endtime){
        return terminalService.trsearch(tid,starttime,endtime);
    }

    @ApiOperation("修改终端")
    @PostMapping("/update")
    public Result update(@RequestBody PointResponse pointResponse){
        return terminalService.update(pointResponse);
    }

    @ApiOperation("根据关键字搜索终端设备，并返回实时位置(最后的位置点) keyword(车牌号)")
    @PostMapping("/search")
    public Result<TerminalSearchResponse> searchTerminal(@RequestParam String keyword){
        return terminalService.searchTerminal(keyword);
    }
}
