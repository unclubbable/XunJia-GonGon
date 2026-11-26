import { _ToAsyncAwait } from '@gykeji/jsutil';
import MAP_CON from '../config/gdMapConf';
const formatCity = (data)=>{
    let arr = [];
    data.forEach(i => {
        if(i.citycode.length){
            arr.push(i);
        }
        if(i.districts.length){
            arr = arr.concat(formatCity(i.districts))
        }
    });
    return arr;
}

/** 高德空字段常为 []，统一成可用字符串 */
const asText = (v) => {
    if (v == null) return '';
    if (Array.isArray(v)) return v.length ? String(v[0]) : '';
    return String(v).trim();
};

/**
 * @Description: 获取城市列表，直接使用高德API
 * @return {*}
 */
const ApiGetCityList = () => _ToAsyncAwait(
    new Promise((res, rej) => {
        uni.request({
            method: 'GET',
            url: `${MAP_CON.cityApiUrl}?subdistrict=2&key=${MAP_CON.cityKey}`,
            success(result){
                res(
                    formatCity(result.data.districts[0].districts).sort((a,b)=>{
                        return a.name.localeCompare(b.name, 'zh-CN');
                    })
                );
            },
            error(e){
                rej(e)
            }
        })
    })
)

/**
 * 逆地理编码：App 端 uni.getLocation(geocode:true) 经常只有坐标、没有 address.city，
 * 用 Web 服务 Key 补城市名 / citycode / 行政区划。
 */
const ApiRegeoCity = (longitude, latitude) => _ToAsyncAwait(
    new Promise((res, rej) => {
        uni.request({
            method: 'GET',
            url: `https://restapi.amap.com/v3/geocode/regeo?key=${MAP_CON.cityKey}&location=${longitude},${latitude}&extensions=base`,
            success(result) {
                const data = result.data || {};
                if (String(data.status) !== '1' || !data.regeocode) {
                    rej(data);
                    return;
                }
                const ac = data.regeocode.addressComponent || {};
                // 直辖市 city 常为空，用 province
                const name = asText(ac.city) || asText(ac.province) || asText(ac.district);
                res({
                    name,
                    cityCode: asText(ac.citycode),
                    adcode: asText(ac.adcode),
                    province: asText(ac.province),
                    district: asText(ac.district),
                    poiName: asText(data.regeocode.formatted_address)
                });
            },
            fail: rej
        });
    })
)

export {
    ApiGetCityList,
    ApiRegeoCity,
    asText
}