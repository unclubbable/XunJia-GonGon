package com.taxi.map.remote;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.taxi.common.constant.AmapConfigConstants;
import com.taxi.api.dto.DicDistrict;
import com.taxi.map.mapper.DicDistrictMapper;
import com.taxi.api.result.Result;
import com.taxi.api.result.ResultCodeEnum;
import lombok.extern.slf4j.Slf4j;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;


@Slf4j
@Service
public class MapDicDistrictClient {
    @Value("${amap.key}")
    private String key;

    @Autowired
    private RestTemplate restTemplate;
    @Autowired
    private DicDistrictMapper dicDistrictMapper;

    public Result dicDistrict(String keywords){
        //拼装请求的url
        StringBuilder url = new StringBuilder();
        url.append(AmapConfigConstants.DISTRICT_URL);//https://restapi.amap.com/v3/config/district
        url.append("?");
        url.append("keywords="+keywords);
        url.append("&");
        url.append("subdistrict=1");
        url.append("&");
        url.append("key="+key);

        log.error("地区字典请求url："+ url.toString() );
        ResponseEntity<String> forEntity = restTemplate.getForEntity(url.toString(), String.class);
        String dicDistrict = forEntity.getBody();
        return parseDistrictEntity(dicDistrict);
    }

    //解析从高德api上传递的地区信息Json,并向插入到数据库中
    public Result parseDistrictEntity(String dicDistrictString){

        JSONObject dicDistrictJsonObject = JSONObject.fromObject(dicDistrictString);
        int status = dicDistrictJsonObject.getInt(AmapConfigConstants.STATUS);
        if(status==0){
            return Result.fail(ResultCodeEnum.MAP_DISTRICT_ERROR);
        }
        JSONArray countryJsonArray = dicDistrictJsonObject.getJSONArray(AmapConfigConstants.DISTRICTS);

        for (int country=0;country<countryJsonArray.size();country++){
            JSONObject countryJsonObject = countryJsonArray.getJSONObject(country);
            String countryAddressCode = countryJsonObject.getString(AmapConfigConstants.ADCODE);
            String countryAddressName = countryJsonObject.getString(AmapConfigConstants.NAME);
            String countryParentAddressCode = "0";
            String countryLevel = countryJsonObject.getString(AmapConfigConstants.LEVEL);

            insertDicDistrict(countryAddressCode,countryAddressName,countryLevel,countryParentAddressCode);

            JSONArray proviceJsonArray = countryJsonObject.getJSONArray(AmapConfigConstants.DISTRICTS);
            for (int p = 0;p< proviceJsonArray.size();p++){
                JSONObject proviceJsonObject = proviceJsonArray.getJSONObject(p);
                String proviceAddressCode = proviceJsonObject.getString(AmapConfigConstants.ADCODE);
                String proviceAddressName = proviceJsonObject.getString(AmapConfigConstants.NAME);
                String proviceParentAddressCode = countryAddressCode;
                String proviceLevel = proviceJsonObject.getString(AmapConfigConstants.LEVEL);

                insertDicDistrict(proviceAddressCode,proviceAddressName,proviceLevel,proviceParentAddressCode);

                JSONArray cityArray = proviceJsonObject.getJSONArray(AmapConfigConstants.DISTRICTS);
                for (int city = 0;city< cityArray.size();city++){
                    JSONObject cityJsonObject = cityArray.getJSONObject(city);
                    String cityAddressCode = cityJsonObject.getString(AmapConfigConstants.ADCODE);
                    String cityAddressName = cityJsonObject.getString(AmapConfigConstants.NAME);
                    String cityParentAddressCode = proviceAddressCode;
                    String cityLevel = cityJsonObject.getString(AmapConfigConstants.LEVEL);

                    insertDicDistrict(cityAddressCode,cityAddressName,cityLevel,cityParentAddressCode);

                    JSONArray districtArray = cityJsonObject.getJSONArray(AmapConfigConstants.DISTRICTS);
                    for (int d = 0;d< districtArray.size();d++){
                        JSONObject districtJsonObject = districtArray.getJSONObject(d);
                        String districtLevel = districtJsonObject.getString(AmapConfigConstants.LEVEL);
                        if(districtLevel.equals(AmapConfigConstants.STREET)){
                            continue;   // 街道就不存了
                        }
                        String districtAddressCode = districtJsonObject.getString(AmapConfigConstants.ADCODE);
                        String districtAddressName = districtJsonObject.getString(AmapConfigConstants.NAME);
                        String districtParentAddressCode = cityAddressCode;
                        insertDicDistrict(districtAddressCode,districtAddressName,districtLevel,districtParentAddressCode);
                    }
                }
            }

        }
        return Result.ok();
    }

    //  向数据库插入行政区划数据
    public void insertDicDistrict(String countryAddressCode,String countryAddressName,String countryLevel,String countryParentAddressCode){
        DicDistrict district = new DicDistrict();
        district.setAddressCode(countryAddressCode);
        district.setLevel(generateLevel(countryLevel));
        district.setParentAddressCode(countryParentAddressCode);
        district.setAddressName(countryAddressName);

        QueryWrapper<DicDistrict> wrapper = new QueryWrapper<>();
        wrapper.eq("address_code", countryAddressCode);
        DicDistrict address_code = dicDistrictMapper.selectOne(wrapper);

        if(ObjectUtils.isEmpty(address_code)){
            dicDistrictMapper.insert(district);
        }
    }

    //定义国、省、市、区
    public int generateLevel(String level){
        int levelInt;
        switch (level){
            case "country":levelInt=0;break;
            case "province":levelInt=1;break;
            case "city":levelInt=2;break;
            case "district":levelInt=3;break;
            default:levelInt=4;
        }
        return levelInt;
    }



    /**
     * 根据关键字清空/删除对应层级的地区数据（和插入逻辑对应）
     */
    public Result deleteDicDistrict(String keywords) {
        try {
            // 1. 先调用高德接口，获取要删除的地区结构（和插入时一致）
            StringBuilder url = new StringBuilder();
            url.append(AmapConfigConstants.DISTRICT_URL);
            url.append("?keywords=").append(keywords);
            url.append("&subdistrict=1");
            url.append("&key=").append(key);

            ResponseEntity<String> forEntity = restTemplate.getForEntity(url.toString(), String.class);
            String dicDistrict = forEntity.getBody();

            // 2. 解析并删除数据
            return parseAndDeleteDistrict(dicDistrict);
        } catch (Exception e) {
            log.error("删除地区数据失败", e);
            return Result.fail(ResultCodeEnum.MAP_DISTRICT_ERROR);
        }
    }

    /**
     * 解析高德返回数据，并递归删除数据库对应数据
     */
    public Result parseAndDeleteDistrict(String dicDistrictString) {
        JSONObject dicDistrictJsonObject = JSONObject.fromObject(dicDistrictString);
        int status = dicDistrictJsonObject.getInt(AmapConfigConstants.STATUS);
        if (status == 0) {
            return Result.fail(ResultCodeEnum.MAP_DISTRICT_ERROR);
        }

        JSONArray countryJsonArray = dicDistrictJsonObject.getJSONArray(AmapConfigConstants.DISTRICTS);

        for (int country = 0; country < countryJsonArray.size(); country++) {
            JSONObject countryJsonObject = countryJsonArray.getJSONObject(country);
            String countryAdcode = countryJsonObject.getString(AmapConfigConstants.ADCODE);

            // 删除国家
            deleteDicDistrictByAdcode(countryAdcode);

            // 删除省份
            JSONArray provinceArray = countryJsonObject.getJSONArray(AmapConfigConstants.DISTRICTS);
            for (int p = 0; p < provinceArray.size(); p++) {
                JSONObject provinceObj = provinceArray.getJSONObject(p);
                String provinceAdcode = provinceObj.getString(AmapConfigConstants.ADCODE);
                deleteDicDistrictByAdcode(provinceAdcode);

                // 删除城市
                JSONArray cityArray = provinceObj.getJSONArray(AmapConfigConstants.DISTRICTS);
                for (int city = 0; city < cityArray.size(); city++) {
                    JSONObject cityObj = cityArray.getJSONObject(city);
                    String cityAdcode = cityObj.getString(AmapConfigConstants.ADCODE);
                    deleteDicDistrictByAdcode(cityAdcode);

                    // 删除区县
                    JSONArray districtArray = cityObj.getJSONArray(AmapConfigConstants.DISTRICTS);
                    for (int d = 0; d < districtArray.size(); d++) {
                        JSONObject districtObj = districtArray.getJSONObject(d);
                        String districtLevel = districtObj.getString(AmapConfigConstants.LEVEL);
                        if (districtLevel.equals(AmapConfigConstants.STREET)) {
                            continue;
                        }
                        String districtAdcode = districtObj.getString(AmapConfigConstants.ADCODE);
                        deleteDicDistrictByAdcode(districtAdcode);
                    }
                }
            }
        }
        return Result.ok("删除成功");
    }

    /**
     * 根据 adcode 删除单条地区数据
     */
    public void deleteDicDistrictByAdcode(String adcode) {
        QueryWrapper<DicDistrict> wrapper = new QueryWrapper<>();
        wrapper.eq("address_code", adcode);
        dicDistrictMapper.delete(wrapper);
    }



    // 获取中国全部省
    public Result dicDistrictprovince(){
        //拼装请求的url
        StringBuilder url = new StringBuilder();
        url.append(AmapConfigConstants.DISTRICT_URL);//https://restapi.amap.com/v3/config/district
        url.append("?");
        url.append("keywords=中华人民共和国");
        url.append("&");
        url.append("subdistrict=1");
        url.append("&");
        url.append("key="+key);

        log.error("省区地区字典请求url："+ url.toString() );
        ResponseEntity<String> forEntity = restTemplate.getForEntity(url.toString(), String.class);
        String dicDistrict = forEntity.getBody();
        return Result.ok(dicDistrict);
    }
}
