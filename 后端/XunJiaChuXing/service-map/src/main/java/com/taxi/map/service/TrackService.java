package com.taxi.map.service;

import com.taxi.map.remote.TrackClient;
import com.taxi.api.response.TrackResponse;
import com.taxi.api.result.Result;
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
