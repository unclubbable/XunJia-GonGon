package com.xunjia.map.service;

import com.xunjia.map.remote.TrackClient;
import com.xunjia.api.response.TrackResponse;
import com.xunjia.api.result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class TrackService {
    @Autowired
    private TrackClient trackClient;

    public Result<TrackResponse> add(String tid) {
        return trackClient.add(tid);
    }
}
