package com.xunjia.map.service;

import com.xunjia.map.remote.ServiceClient;
import com.xunjia.api.result.Result;
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
