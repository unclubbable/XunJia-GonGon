import { MsbRequest } from '../plugins/request'

/**
 * 获取有效车辆类型字典
 */
const ApiGetDictCarClassAll = () => MsbRequest.get('/dict-car-class/all')

export {
  ApiGetDictCarClassAll
}
