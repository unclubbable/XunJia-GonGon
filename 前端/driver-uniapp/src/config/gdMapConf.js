/*
 * @Description: 高德地图配置
 */
export default {
    // 高德地图JS Api key
    key:'00000000000000000000000000000',
    // 高德地图JS Api key对应的秘钥，正式环境最好不要放前端
    securityJsCode : '0000000000000000000000000000',
    // 城市获取key
    cityKey : '000000000000000000000000000000000000000000',
    // 高德城市请求地址(行政区请求地址)
    cityApiUrl : 'https://restapi.amap.com/v3/config/district',
    // 默认选中城市
    city: {
        adcode: "110000",
        center: "116.407387,39.904179",
        citycode: "010",
        name: "北京市"
    }
}
