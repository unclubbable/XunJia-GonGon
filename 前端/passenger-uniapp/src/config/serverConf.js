const url = "0.0.0.0"
export default {
    // 支付服务
    pay: "http://" + url + ':7073',
    // sse服务
    sse: "ws://" + url + ':9000',
    // 其他接口服务
    other: "http://" + url + ':7073'
}
