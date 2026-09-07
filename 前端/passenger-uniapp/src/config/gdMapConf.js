import local from './gdMapConf.local.js'

// 真实 Key 在 gdMapConf.local.js（已被 .gitignore，不会进 GitHub）
// 克隆仓库后请复制 gdMapConf.local.js.example → gdMapConf.local.js 并填写
export default {
    key: local.key,
    securityJsCode: local.securityJsCode,
    cityKey: local.cityKey,
    cityApiUrl: 'https://restapi.amap.com/v3/config/district',
    city: {
        adcode: '110000',
        center: '116.407387,39.904179',
        citycode: '010',
        name: '北京市'
    }
}
