package com.taxi.map.remote;

import cn.hutool.json.JSONUtil;
import com.taxi.common.constant.AmapConfigConstants;
import com.taxi.api.response.DirectionResponse;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


@Slf4j
@Service
public class MapDirectionClient {
    @Value("${amap.key}")
    private String amapKey;

    @Autowired
    private RestTemplate restTemplate;

    public DirectionResponse direction(String depLatitude, String depLongitude, String destLatitude, String destLongitude) {
        //组装请求调用url
        StringBuilder urlBuild = new StringBuilder();
        urlBuild.append(AmapConfigConstants.DIRECTION_URL);
        urlBuild.append("?");
        urlBuild.append("origin="+depLatitude+","+depLongitude);
        urlBuild.append("&");
        urlBuild.append("destination="+destLatitude+","+destLongitude);
        urlBuild.append("&");
        urlBuild.append("extensions=base");
        urlBuild.append("&");
        urlBuild.append("output=json");
        urlBuild.append("&");
        urlBuild.append("key="+amapKey);

        //调用高德接口
        ResponseEntity<String> directionEntity = restTemplate.getForEntity(urlBuild.toString(), String.class);
        log.debug("(两地距离)高德调用结果"+JSONUtil.toJsonStr(directionEntity));
        String directionString = directionEntity.getBody();
        //解析接口
        DirectionResponse directionResponse = parseDirectionEntity(directionString);
        return directionResponse;
    }

    //取出json格式里面的属性，封装到类里面去
    private DirectionResponse parseDirectionEntity(String directionString){
        DirectionResponse directionResponse=null;
        try {
            //转成json对象
            JSONObject result=JSONObject.fromObject(directionString);
            if(result.has(AmapConfigConstants.STATUS)){
                int status = result.getInt(AmapConfigConstants.STATUS);
                if(status==0){
                    return null;
                }
                if(result.has(AmapConfigConstants.ROUTE)){
                    JSONObject routeObject = result.getJSONObject(AmapConfigConstants.ROUTE);
                    if (routeObject.has(AmapConfigConstants.PATHS)) {
                        JSONArray pathsArray = routeObject.getJSONArray(AmapConfigConstants.PATHS);
                        JSONObject pathObject = pathsArray.getJSONObject(0);
                        directionResponse=new DirectionResponse();
                        if(pathObject.has(AmapConfigConstants.DISTANCE)){
                            int distance = pathObject.getInt(AmapConfigConstants.DISTANCE);
                            directionResponse.setDistance(distance);
                        }
                        if(pathObject.has(AmapConfigConstants.DURATION)){
                            int duration = pathObject.getInt(AmapConfigConstants.DURATION);
                            directionResponse.setDuration(duration);
                        }
                    }
                }
            }
        }catch (Exception e){

        }
        return directionResponse;
    }
}
