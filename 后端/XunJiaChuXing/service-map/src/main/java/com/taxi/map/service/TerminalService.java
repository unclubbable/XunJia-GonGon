package com.taxi.map.service;

import com.taxi.map.remote.TerminalClient;
import com.taxi.api.response.AroundsearchResponse;
import com.taxi.api.response.PointResponse;
import com.taxi.api.result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class TerminalService {
    @Autowired
    private TerminalClient terminalClient;

    public Result add(String name,String desc){
        return terminalClient.add(name,desc);
    }

    public Result aroundsearch(AroundsearchResponse aroundsearchResponse) {
        return terminalClient.aroundsearch(aroundsearchResponse);
    }

    public Result trsearch(String tid, Long starttime, Long endtime) {
        return terminalClient.trsearch(tid,starttime,endtime);
    }

    public Result update(PointResponse pointResponse) {
        return terminalClient.update(pointResponse);
    }

    public Result query() {
        return terminalClient.query();
    }

    public Result delete(String tid) {
        return terminalClient.delete(tid);
    }

    public Result searchTerminal(String keyword) {
        return terminalClient.searchTerminal(keyword);
    }
}
