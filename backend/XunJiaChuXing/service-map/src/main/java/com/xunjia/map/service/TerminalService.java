package com.xunjia.map.service;

import com.xunjia.map.remote.TerminalClient;
import com.xunjia.api.response.AroundsearchResponse;
import com.xunjia.api.response.PointResponse;
import com.xunjia.api.result.Result;
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

    /** 轨迹查询，可抽稀 */
    public Result trsearch(String tid, Long starttime, Long endtime,
                           Integer simplifyType, Double distanceMeters, Boolean needPoints) {
        return terminalClient.trsearch(tid, starttime, endtime, simplifyType, distanceMeters, needPoints);
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
