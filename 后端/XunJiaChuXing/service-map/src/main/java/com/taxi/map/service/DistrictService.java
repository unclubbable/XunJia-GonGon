package com.taxi.map.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.taxi.api.dto.DicDistrict;
import com.taxi.map.mapper.DicDistrictMapper;
import com.taxi.map.remote.MapDicDistrictClient;
import com.taxi.api.result.Result;
import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;


@Service
public class DistrictService {
    @Autowired
    private MapDicDistrictClient mapDicDistrictClient;
    @Autowired
    private DicDistrictMapper dicDistrictMapper;

    public Result initDicDistrict(String keywords) {
        return mapDicDistrictClient.dicDistrict(keywords);
    }

    public Result getDistrictInfo() {
        //查找 “市” 结尾的
        List<DicDistrict> dicDistricts = dicDistrictMapper.selectList(
                new LambdaQueryWrapper<DicDistrict>().likeLeft(DicDistrict::getAddressName, "市")
        );
        return Result.ok(dicDistricts);
    }

    public Result DeleteDicDistrict(String keywords) {
        return mapDicDistrictClient.deleteDicDistrict(keywords);
    }

    public Result listDicDistrict() {
        // 查找 以“省”结尾 或者 以“市”结尾 的数据
        List<DicDistrict> dicDistricts = dicDistrictMapper.selectList(
                new LambdaQueryWrapper<DicDistrict>()
                        .or(w -> w.likeLeft(DicDistrict::getAddressName, "省"))  // 以省结尾
                        .or(w -> w.likeLeft(DicDistrict::getAddressName, "市")) // 以市结尾
        );
        return Result.ok(dicDistricts);
    }

    public Result listprovinceDicDistrict() {

        Object dataObj = mapDicDistrictClient.dicDistrictprovince().getData();

        // 将 JSON 字符串解析为 Map
        JSONObject jsonObject = JSONObject.fromObject(dataObj.toString());
        Map<String, Object> data = (Map<String, Object>) jsonObject;


        List<Map<String, Object>> districts = (List<Map<String, Object>>) data.get("districts");
        List<Map<String, Object>> list = (List<Map<String, Object>>) districts.get(0).get("districts");

        return Result.ok(list);
    }
}
