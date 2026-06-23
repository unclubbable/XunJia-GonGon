package com.taxi.map.remote;

import cn.hutool.json.JSONUtil;
import com.taxi.api.response.*;
import com.taxi.common.constant.AmapConfigConstants;
import com.taxi.api.result.Result;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;


@Slf4j
@Service
public class TerminalClient {
    @Value("${amap.key}")
    private String amapKey;

    @Value("${amap.sid}")
    private String amapSid;

    @Autowired
    private RestTemplate restTemplate;

    public Result add(String name, String desc) {
        //拼装请求的url
        StringBuilder url = new StringBuilder();
        url.append(AmapConfigConstants.TERMINAL_ADD);
        url.append("?");
        url.append("key=" + amapKey);
        url.append("&");
        url.append("sid=" + amapSid);
        url.append("&");
        url.append("name=" + name);
        url.append("&");
        url.append("desc=" + desc);

        log.error("终端添加请求url："+ url.toString() );
        ResponseEntity<String> stringResponseEntity = restTemplate.postForEntity(url.toString(), null, String.class);
        String body = stringResponseEntity.getBody();
        JSONObject result = JSONObject.fromObject(body);
        JSONObject data = result.getJSONObject("data");
        String tid = data.getString("tid");

        TerminalResponse terminalResponse = new TerminalResponse();
        terminalResponse.setTid(tid);

        return Result.ok(terminalResponse);
    }

    public Result aroundsearch(AroundsearchResponse aroundsearchResponse) {
        //拼装请求的url
        StringBuilder url = new StringBuilder();
        url.append(AmapConfigConstants.TERMINAL_AROUNDSEARCH);
        url.append("?");
        url.append("key=" + amapKey);
        url.append("&");
        url.append("sid=" + amapSid);
        url.append("&");
        url.append("center=" + aroundsearchResponse.getCenter());
        url.append("&");
        url.append("radius=" + aroundsearchResponse.getRadius());
        log.debug("周边扫描请求url："+ url.toString() );

        ResponseEntity<String> stringResponseEntity = restTemplate.postForEntity(url.toString(), null, String.class);
        log.debug("周边扫描结果："+ stringResponseEntity.getBody());
        List<TerminalResponse> terminalResponses = new ArrayList<>();
        String body = stringResponseEntity.getBody();
        JSONObject result = JSONObject.fromObject(body);
        if (result.has("data")) {
            JSONObject data = result.getJSONObject("data");
            if (data.has("results")) {
                JSONArray results = data.getJSONArray("results");
                String vehicleNo = "无车牌号";
                for (int i = 0; i < results.size(); i++) {
                    TerminalResponse terminalResponse = new TerminalResponse();

                    JSONObject jsonObject = results.getJSONObject(i);
                    if (jsonObject.has("desc")) {
                        vehicleNo = jsonObject.getString("desc");
                    } else if (jsonObject.has("name")) {
                        vehicleNo = jsonObject.getString("name");
                    }
                    String tid = jsonObject.getString("tid");
                    JSONObject location = jsonObject.getJSONObject("location");
                    String longitude = location.getString("longitude");
                    String latitude = location.getString("latitude");

                    terminalResponse.setLongitude(longitude);
                    terminalResponse.setLatitude(latitude);
                    terminalResponse.setTid(tid);
                    terminalResponse.setVehicleNo(vehicleNo);
                    terminalResponses.add(terminalResponse);
                }
            }
        }
        return Result.ok(terminalResponses);
    }

    public Result trsearch(String tid, Long starttime, Long endtime) {

//        //假数据start
//        starttime=1701677051415l;
//        endtime=1701679146426l;
//        //假数据end

        //拼装请求的url
        StringBuilder url = new StringBuilder();
        url.append(AmapConfigConstants.TERMINAL_TRSEARCH);
        url.append("?");
        url.append("key=" + amapKey);
        url.append("&");
        url.append("sid=" + amapSid);
        url.append("&");
        url.append("tid=" + tid);
        url.append("&");
        url.append("starttime=" + starttime);
        url.append("&");
        url.append("endtime=" + endtime);

        log.debug("轨迹查询请求url："+ url.toString() );
        ResponseEntity<String> forEntity = restTemplate.getForEntity(url.toString(), String.class);
        JSONObject result = JSONObject.fromObject(forEntity.getBody());
        JSONObject data = result.getJSONObject("data");
        if(data==null){
            return Result.fail(result);
        }
        int counts = data.getInt("counts");
        if (counts == 0) {
            return null;
        }
        JSONArray tracks = data.getJSONArray("tracks");
        long driveMile = 0L;
        long driveTime = 0L;
        for (int i = 0; i < tracks.size(); i++) {
            JSONObject jsonObject = tracks.getJSONObject(i);

            long distance = jsonObject.getLong("distance");
            driveMile = driveMile + distance;

            long time = jsonObject.getLong("time");
            time = time / (1000 * 60);
            driveTime += time;
        }
        TrsearchResponse trsearchResponse = new TrsearchResponse();
        trsearchResponse.setDriveTime(driveTime);
        trsearchResponse.setDriveMile(driveMile);
        return Result.ok(trsearchResponse);
    }

    public Result update(PointResponse pointResponse) {
        try {
            //拼装请求的url
            StringBuilder url = new StringBuilder();
            url.append(AmapConfigConstants.TERMINAL_UPDATE);
            url.append("?");
            url.append("key="+amapKey);
            url.append("&");
            url.append("sid="+amapSid);
            url.append("&");
            url.append("tid="+pointResponse.getTid());
            url.append("&");
            url.append("trid="+pointResponse.getTrid());

            ResponseEntity<String> stringResponseEntity = restTemplate.postForEntity(URI.create(url.toString()), null, String.class);

            JSONObject result = JSONObject.fromObject(stringResponseEntity.getBody());
            return Result.ok(result);
        } catch (RestClientException e) {
            return Result.fail(e.getMessage());
        }
    }

    public Result query() {
        try {
            //拼装请求的url
            StringBuilder url = new StringBuilder();
            url.append(AmapConfigConstants.TERMINAL_QUERY);
            url.append("?");
            url.append("key="+amapKey);
            url.append("&");
            url.append("sid="+amapSid);
            log.debug("终端查询信息请求url："+ url.toString());
            ResponseEntity<String> stringResponseEntity = restTemplate.getForEntity(URI.create(url.toString()), String.class);

            JSONObject result = JSONObject.fromObject(stringResponseEntity.getBody());
            return Result.ok(result);
        } catch (RestClientException e) {
            return Result.fail(e.getMessage());
        }
    }

    public Result delete(String tid) {
        try {
            //拼装请求的url
            StringBuilder url = new StringBuilder();
            url.append(AmapConfigConstants.TERMINAL_DELETE);
            url.append("?");
            url.append("key="+amapKey);
            url.append("&");
            url.append("sid="+amapSid);
            url.append("&");
            url.append("tid="+tid);
            log.debug("删除终端请求url："+ url.toString());
            ResponseEntity<String> stringResponseEntity = restTemplate.postForEntity(URI.create(url.toString()), null, String.class);

            JSONObject result = JSONObject.fromObject(stringResponseEntity.getBody());
            return Result.ok(result);
        } catch (RestClientException e) {
            return Result.fail(e.getMessage());
        }
    }

    public Result searchTerminal(String keyword) {
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("key", amapKey);
            params.add("sid", amapSid);
            params.add("keywords", keyword);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> stringResponseEntity = restTemplate.postForEntity(
                    AmapConfigConstants.TERMINAL_QUERY_LAST,
                    request,
                    String.class
            );
            log.debug("终端查询最后位置信息请求url："+ AmapConfigConstants.TERMINAL_QUERY_LAST);
            log.debug("终端查询最后位置信息结果："+ stringResponseEntity.getBody());
            JSONObject result = JSONObject.fromObject(stringResponseEntity.getBody());

            JSONObject data = result.getJSONObject("data");
            JSONObject results = data.getJSONArray("results").getJSONObject(0);
            //封装数据
            TerminalSearchResponse terminalResponse = new TerminalSearchResponse();
            terminalResponse.setTid(results.getString("tid"));
            terminalResponse.setVehicleNo(results.getString("name"));
            terminalResponse.setLocatetime(results.getString("locatetime"));
            if (results.optJSONObject("location") != null){
                Locatetion locatetion = new Locatetion();
                locatetion.setLatitude(results.getJSONObject("location").getString("latitude"));
                locatetion.setLongitude(results.getJSONObject("location").getString("longitude"));
                terminalResponse.setLocation(locatetion);
            }
         return Result.ok(terminalResponse);
        } catch (RestClientException e) {
            return Result.fail(e.getMessage());
        }

    }
}
