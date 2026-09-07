import { MsbRequest } from '../plugins/request';

/**
 * 获取本地地区字典（市级），用于 address -> 城市名 映射
 */
const ApiGetDistrict = () => MsbRequest.get('/district');

export {
	ApiGetDistrict
}
