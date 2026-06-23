package com.taxi.map.service;

import com.taxi.map.remote.ServiceClient;
import com.taxi.api.result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class ServiceFromMapService {
    @Autowired
    private ServiceClient serviceClient;

    //创建服务
    public Result add(String name){
        return serviceClient.add(name);
    }
}
