package com.taxi.service;

import com.taxi.api.Client.ServiceDriverUserClient;
import com.taxi.api.Client.ServiceMapClient;
import com.taxi.api.dto.Car;
import com.taxi.api.response.TerminalSearchResponse;
import com.taxi.api.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class TerminalService {
    @Autowired
    private ServiceMapClient serviceMapClient;
    @Autowired
    private ServiceDriverUserClient serviceDriverUserClient;
    public Result searchKeyword(String keyword) {
        if (keyword == null){
            return Result.fail();
        }
        else {
            TerminalSearchResponse data = serviceMapClient.searchTerminal(keyword).getData();
            data.setLocatetime(formatSeconds(Long.parseLong(data.getLocatetime())));      //将时间戳转换成时间
            return Result.ok(data);
        }
    }

    public Result searchKeywordList() {
        Object data = serviceDriverUserClient.getCarList(1, 10000000, null, null).getData();
        List<Map<String, Object>> list = (List<Map<String, Object>>) ((Map<String, Object>) data).get("items");
        if (list.size()==0){
            return Result.fail().setMessage("无车辆信息");
        }
        else {
            List<TerminalSearchResponse> result = new ArrayList<>();
            for (Map<String, Object> car : list) {
                TerminalSearchResponse res = serviceMapClient.searchTerminal(car.get("vehicleNo").toString()).getData();
                res.setLocatetime(formatSeconds(Long.parseLong(res.getLocatetime())));      //将时间戳转换成时间
                result.add(res);
            }
            return Result.ok(result);
        }
    }


    public String formatSeconds(long timestampMillis) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestampMillis), ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("HH:mm:ss"));
    }
}
