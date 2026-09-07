package com.taxi.map.remote;

import com.taxi.api.constant.TrackSimplifyType;
import com.taxi.api.response.*;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import com.taxi.api.util.TrackSimplifyUtils;
import com.taxi.common.constant.AmapConfigConstants;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONArray;
import net.sf.json.JSONNull;
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
import java.util.Collections;
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

    /** 高德单页最大点数 */
    private static final int AMAP_TRSEARCH_PAGE_SIZE = 999;

    /** 翻页熔断，防死循环 */
    private static final int AMAP_TRSEARCH_MAX_PAGE = 100;

    /** 查终端轨迹，支持抽稀 / 不要点 */
    public Result trsearch(String tid, Long starttime, Long endtime,
                           Integer simplifyType, Double distanceMeters, Boolean needPoints) {
        boolean wantPoints = needPoints == null || needPoints;
        int type = simplifyType == null ? TrackSimplifyType.FULL : simplifyType;

        // 计价：只要里程/时长，一页搞定
        if (!wantPoints) {
            JSONObject data = requestTrsearchPage(tid, starttime, endtime, 1, false);
            if (data == null) {
                return Result.fail(ResultCodeEnum.TRACK_DATA_EMPTY);
            }
            MileTime mileTime = sumMileTime(data);
            if (mileTime == null) {
                return Result.fail(ResultCodeEnum.TRACK_DATA_EMPTY);
            }
            TrsearchResponse response = new TrsearchResponse();
            response.setDriveMile(mileTime.driveMile);
            response.setDriveTime(mileTime.driveTime);
            response.setSimplifyType(type);
            response.setRawPointCount(0);
            response.setPointCount(0);
            response.setPoints(Collections.emptyList());
            return Result.ok(response);
        }

        // 管理端画线：拉全点再抽稀
        List<TrackPointDTO> rawPoints = new ArrayList<>();
        MileTime mileTime = null;
        int page = 1;
        while (page <= AMAP_TRSEARCH_MAX_PAGE) {
            JSONObject data = requestTrsearchPage(tid, starttime, endtime, page, true);
            if (data == null) {
                // 首页挂了当没轨迹；后面页挂了带已有点返回
                if (page == 1) {
                    return Result.fail(ResultCodeEnum.TRACK_DATA_EMPTY);
                }
                log.warn("轨迹翻页中断 tid={}, page={}, 已解析点数={}", tid, page, rawPoints.size());
                break;
            }

            if (page == 1) {
                mileTime = sumMileTime(data);
                if (mileTime == null) {
                    return Result.fail(ResultCodeEnum.TRACK_DATA_EMPTY);
                }
            }

            int pagePointCount = appendPointsFromTracks(data, rawPoints);
            log.debug("轨迹翻页 tid={}, page={}, 本页解析点数={}, 累计={}", tid, page, pagePointCount, rawPoints.size());

            // 本页点数不足一页，说明已经拉完
            if (pagePointCount < AMAP_TRSEARCH_PAGE_SIZE) {
                break;
            }
            page++;
        }

        if (mileTime == null) {
            return Result.fail(ResultCodeEnum.TRACK_DATA_EMPTY);
        }

        List<TrackPointDTO> outPoints = TrackSimplifyUtils.simplify(rawPoints, type, distanceMeters);
        TrsearchResponse response = new TrsearchResponse();
        response.setDriveMile(mileTime.driveMile);
        response.setDriveTime(mileTime.driveTime);
        response.setPoints(outPoints);
        response.setRawPointCount(rawPoints.size());
        response.setPointCount(outPoints.size());
        response.setSimplifyType(type);

        log.info("轨迹查询完成 tid={}, rawPoints={}, outPoints={}, simplifyType={}, pages~={}",
                tid, rawPoints.size(), outPoints.size(), type, page);
        return Result.ok(response);
    }

    /** 老接口：默认要全量点 */
    public Result trsearch(String tid, Long starttime, Long endtime) {
        return trsearch(tid, starttime, endtime, TrackSimplifyType.FULL, null, true);
    }

    /** 高德 trsearch 单页；withPoints=false 只要摘要 */
    private JSONObject requestTrsearchPage(String tid, Long starttime, Long endtime,
                                           int page, boolean withPoints) {
        StringBuilder url = new StringBuilder();
        url.append(AmapConfigConstants.TERMINAL_TRSEARCH);
        url.append("?");
        url.append("key=").append(amapKey);
        url.append("&");
        url.append("sid=").append(amapSid);
        url.append("&");
        url.append("tid=").append(tid);
        url.append("&");
        url.append("starttime=").append(starttime);
        url.append("&");
        url.append("endtime=").append(endtime);
        url.append("&");
        url.append("ispoints=").append(withPoints ? 1 : 0);
        if (withPoints) {
            url.append("&");
            url.append("page=").append(page);
            url.append("&");
            url.append("pagesize=").append(AMAP_TRSEARCH_PAGE_SIZE);
        }

        try {
            log.debug("轨迹查询请求url：{}", url);
            ResponseEntity<String> forEntity = restTemplate.getForEntity(url.toString(), String.class);
            String body = forEntity.getBody();
            log.debug("轨迹查询结果 page={}：{}", page, body);

            if (body == null || body.isEmpty()) {
                return null;
            }

            JSONObject result = JSONObject.fromObject(body);
            if (!result.has("data")) {
                return null;
            }
            Object dataObj = result.get("data");
            if (dataObj == null || dataObj instanceof JSONNull) {
                return null;
            }

            JSONObject data = result.getJSONObject("data");
            if (data == null || !data.has("counts")) {
                return null;
            }
            if (data.getInt("counts") == 0) {
                return null;
            }
            if (!data.has("tracks")) {
                return null;
            }
            return data;
        } catch (RestClientException ex) {
            log.error("调用高德 trsearch 失败 tid={}, page={}, err={}", tid, page, ex.getMessage());
            return null;
        }
    }

    /** 累加里程/时长，只算第一页 */
    private MileTime sumMileTime(JSONObject data) {
        JSONArray tracks = data.getJSONArray("tracks");
        if (tracks == null || tracks.isEmpty()) {
            return null;
        }
        long driveMile = 0L;
        long driveTime = 0L;
        for (int i = 0; i < tracks.size(); i++) {
            JSONObject track = tracks.getJSONObject(i);
            if (track.has("distance")) {
                driveMile += track.getLong("distance");
            }
            if (track.has("time")) {
                // 高德 time 为毫秒，业务侧统一为分钟
                driveTime += track.getLong("time") / (1000 * 60);
            }
        }
        return new MileTime(driveMile, driveTime);
    }

    /** 解析本页 points，返回本页点数 */
    private int appendPointsFromTracks(JSONObject data, List<TrackPointDTO> allPoints) {
        JSONArray tracks = data.getJSONArray("tracks");
        if (tracks == null || tracks.isEmpty()) {
            return 0;
        }
        int parsed = 0;
        for (int i = 0; i < tracks.size(); i++) {
            JSONObject track = tracks.getJSONObject(i);
            if (!track.has("points")) {
                continue;
            }
            Object pointsObj = track.get("points");
            if (pointsObj == null || pointsObj instanceof JSONNull) {
                continue;
            }
            JSONArray points = track.getJSONArray("points");
            for (int j = 0; j < points.size(); j++) {
                TrackPointDTO point = parseTrackPoint(points.getJSONObject(j));
                if (point != null) {
                    allPoints.add(point);
                    parsed++;
                }
            }
        }
        return parsed;
    }

    /** 解析单点，location=经度,纬度；坏了返回 null */
    private TrackPointDTO parseTrackPoint(JSONObject pointJson) {
        if (pointJson == null || !pointJson.has("location")) {
            return null;
        }
        String location = pointJson.getString("location");
        if (location == null || location.trim().isEmpty()) {
            return null;
        }
        String[] parts = location.split(",");
        if (parts.length < 2) {
            log.warn("轨迹点 location 格式异常: {}", location);
            return null;
        }
        TrackPointDTO dto = new TrackPointDTO();
        dto.setLongitude(parts[0].trim());
        dto.setLatitude(parts[1].trim());
        if (pointJson.has("locatetime") && !(pointJson.get("locatetime") instanceof JSONNull)) {
            try {
                dto.setLocateTime(pointJson.getLong("locatetime"));
            } catch (Exception ex) {
                // 时间解析失败不影响画线
                log.debug("轨迹点 locatetime 解析失败: {}", pointJson.get("locatetime"));
            }
        }
        return dto;
    }

    /** 里程/时长内部载体 */
    private static final class MileTime {
        private final long driveMile;
        private final long driveTime;

        private MileTime(long driveMile, long driveTime) {
            this.driveMile = driveMile;
            this.driveTime = driveTime;
        }
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
