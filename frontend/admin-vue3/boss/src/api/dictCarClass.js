import request from '@/utils/request'

/** 分页查询车辆类型 */
export function getDictCarClassList(query) {
  return request({
    url: '/driver-user/dict-car-class/list',
    method: 'get',
    params: query
  })
}

/** 全部有效车辆类型（下拉 / 映射） */
export function getDictCarClassAll() {
  return request({
    url: '/driver-user/dict-car-class/all',
    method: 'get'
  })
}

/** 新增或更新车辆类型 */
export function saveDictCarClass(data) {
  return request({
    url: '/driver-user/dict-car-class',
    method: 'post',
    data
  })
}

/** 删除车辆类型 */
export function deleteDictCarClass(id) {
  return request({
    url: '/driver-user/dict-car-class/' + id,
    method: 'delete'
  })
}
