/**
 * 默认服务端地址配置（可被本地缓存覆盖；调试页：pages/dev/account）
 * ws：WebSocket 推送服务根地址（历史字段名曾为 sse，读取时需兼容）
 */
const url = "192.168.2.102"
export default {
    // 支付接口：统一网关乘客端根路径（订单服务 /alipay）
    pay: "http://" + url + ':7071/passenger-user',
    // WebSocket 推送服务
    ws: "ws://" + url + ':9000',
    // 统一网关-乘客端根路径
    other: "http://" + url + ':7071/passenger-user'
}
