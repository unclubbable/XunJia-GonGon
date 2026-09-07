/**
 * 默认服务端地址配置（可被本地缓存覆盖）
 * ws：WebSocket 推送服务根地址（历史字段名曾为 sse，读取时需兼容）
 */
const url = "192.168.2.102";
export default {
    // WebSocket 推送服务
    ws: "ws://"+url + ':9000',
    // 统一网关-司机端根路径
    other: "http://"+url + ':7071/driver-user'
}
