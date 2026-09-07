package com.taxi.api.Client;

import com.taxi.api.request.ForecastPriceDOT;
import com.taxi.api.response.*;
import com.taxi.api.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;


@FeignClient("service-map")
public interface ServiceMapClient {
    @GetMapping("/district")
    public Result getDistrictInfo();

    @PostMapping("/terminal/aroundsearch")
    public Result<List<TerminalResponse>> aroundsearch(@RequestBody AroundsearchResponse aroundsearchResponse);

    /**
     * 轨迹查询。计价 needPoints=false；管理端画线 true，simplifyType 1全量/2抽稀。
     */
    @PostMapping("/terminal/trsearch")
    Result<TrsearchResponse> trsearch(@RequestParam("tid") String tid,
                                      @RequestParam("starttime") Long starttime,
                                      @RequestParam("endtime") Long endtime,
                                      @RequestParam(value = "simplifyType", required = false) Integer simplifyType,
                                      @RequestParam(value = "distanceMeters", required = false) Double distanceMeters,
                                      @RequestParam(value = "needPoints", required = false) Boolean needPoints);

    @PostMapping("/terminal/add")
    public Result<TerminalResponse> addTerminal(@RequestParam("name") String name,@RequestParam(value = "desc",required = false)String desc);

    @PostMapping("/terminal/delete")
    public Result<TerminalResponse> deleteTerminal(@RequestParam("tid") String tid);


    @PostMapping("/track/add")
    public Result<TrackResponse> addTrack(@RequestParam String tid);

    @PostMapping("/terminal/search")
    public Result<TerminalSearchResponse> searchTerminal(@RequestParam String keyword);

    @PostMapping("/direction/driving")
    public Result<DirectionResponse> driving(@RequestBody ForecastPriceDOT forecastPriceDOT);
}

