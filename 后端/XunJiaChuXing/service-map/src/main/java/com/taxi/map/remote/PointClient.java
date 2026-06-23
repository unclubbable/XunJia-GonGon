package com.taxi.map.remote;

import com.taxi.common.constant.AmapConfigConstants;
import com.taxi.api.response.PointDTO;
import com.taxi.api.response.PointResponse;
import com.taxi.api.result.Result;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;


@Slf4j
@Service
public class PointClient {
    @Value("${amap.key}")
    private String amapKey;

    @Value("${amap.sid}")
    private String amapSid;

    @Autowired
    private RestTemplate restTemplate;

    public Result upload(PointResponse pointResponse) {
        try {
            //拼装请求的url
            StringBuilder url = new StringBuilder();
            url.append(AmapConfigConstants.POINT_UPLOAD);
            url.append("?");
            url.append("key="+amapKey);
            url.append("&");
            url.append("sid="+amapSid);
            url.append("&");
            url.append("tid="+pointResponse.getTid());  // 终端id
            url.append("&");
            url.append("trid="+pointResponse.getTrid()); // 轨迹id
            url.append("&");
            url.append("points=");

            PointDTO[] points = pointResponse.getPoints();
            url.append("%5B");
            for (PointDTO point : points) {
                url.append("%7B");
                url.append("%22location%22");
                url.append("%3A");
                url.append("%22"+point.getLocation()+"%22");
                url.append("%2C");
                url.append("%22locatetime%22");
                url.append("%3A");
                url.append(System.currentTimeMillis());
                url.append("%7D");
            }
            url.append("%5D");
            log.error("轨迹点上传请求url："+ url.toString());
            ResponseEntity<String> stringResponseEntity = restTemplate.postForEntity(URI.create(url.toString()), null, String.class);
            log.error("轨迹点上传结果："+ stringResponseEntity.getBody());
            JSONObject result = JSONObject.fromObject(stringResponseEntity.getBody());
            return Result.ok(result);
        } catch (RestClientException e) {
            return Result.fail(e.getMessage());
        }
    }
}
