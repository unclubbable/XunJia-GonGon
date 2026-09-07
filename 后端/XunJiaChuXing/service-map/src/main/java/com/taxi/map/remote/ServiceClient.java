package com.taxi.map.remote;

import com.taxi.common.constant.AmapConfigConstants;
import com.taxi.api.response.ServiceResponse;
import com.taxi.api.result.Result;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


@Service
public class ServiceClient {
    @Value("${amap.key}")
    private String amapKey;

    @Autowired
    private RestTemplate restTemplate;

    public Result add(String name){
        //拼装请求的url
        StringBuilder url = new StringBuilder();
        url.append(AmapConfigConstants.SERVICE_ADD_URL);
        url.append("?");
        url.append("key="+amapKey);
        url.append("&");
        url.append("name="+name);

        ResponseEntity<String> stringResponseEntity = restTemplate.postForEntity(url.toString(),null, String.class);
        /**
         * {
         *     "errcode": 10000,
         *     "errmsg": "OK",
         *     "data": {
         *         "name": "无忧出行",
         *         "sid": 1007629
         *     }
         * }
         */
        String body = stringResponseEntity.getBody();
        JSONObject result = JSONObject.fromObject(body);
        JSONObject data = result.getJSONObject("data");
        Integer sid = data.getInt("sid");
        ServiceResponse serviceResponse = new ServiceResponse();
        serviceResponse.setSid(sid+"");

        return Result.ok(serviceResponse);
    }
}
