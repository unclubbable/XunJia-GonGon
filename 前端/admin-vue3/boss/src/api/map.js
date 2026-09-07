import request from '@/utils/request'

/**
 * 查询终端在时间窗内的轨迹（含轨迹点）。
 * simplifyType: 1=全量，2=按距离抽稀
 */
export function trsearch(params) {
  return request({
    url: '/terminal/trsearch',
    method: 'post',
    params,
    // 拉全点可能翻多页，适当延长超时
    timeout: 60000
  })
}
