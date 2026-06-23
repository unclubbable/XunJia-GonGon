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

    @PostMapping("/terminal/trsearch")
    public Result<TrsearchResponse> trsearch(@RequestParam String tid, @RequestParam Long starttime, @RequestParam Long endtime);

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

