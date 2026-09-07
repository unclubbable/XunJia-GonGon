import { MsbRequest } from '../plugins/request';

/**
 * @Description: 获取验证码
 * @param {{ driverPhone: string }} data
 */
const ApiGetVerifyCode = ({ driverPhone }) =>
	MsbRequest.post('/verification-code', { driverPhone }, { notVerifyToken: true });

/**
 * @Description: 校验验证码并登录
 * @param {{ driverPhone: string, verificationCode: string }} data
 */
const ApiPostVerifyCodeCheck = ({ driverPhone, verificationCode }) =>
	MsbRequest.post(
		'/verification-code-check',
		{ driverPhone, verificationCode },
		{ notVerifyToken: true }
	);

/**
 * @Description: 根据 token 获取司机车辆绑定信息
 */
const ApiGetUserCarInfo = () => MsbRequest.get('/driver-car-binding-relationship');

/**
 * @Description: 获取司机信息
 */
const ApiGetUserInfo = (driver_id) => MsbRequest.get('/get-driver-info/' + driver_id);

/**
 * 轨迹点上传
 */
const ApiPostUpdatePoint = (data = {carId, points}) => MsbRequest.post('/point/upload', data);

/**
 * 获取司机工作状态
 */
const ApiGetWorkStatus = (params = {driverId}) => MsbRequest.get('/work-status', params);

/**
 * 更新司机工作状态
 */
const ApiPostUpdateWorkStatus = (data = {driverId, workStatus}) => MsbRequest.post('/driver-user-work-status', data);

/**
 * 获取司机最近 N 月的收入信息
 */
const ApiGetUserMoney = (driverId, RecentlyMonth) =>
	MsbRequest.get('/driver-user-money/' + driverId + '/' + RecentlyMonth);

/**
 * 获取车辆信息
 */
const ApiGetCarInfo = (cid) => MsbRequest.get('/get-car/' + cid);

/**
 * 获取车辆类型字典（有效）
 */
const ApiGetDictCarClassAll = () => MsbRequest.get('/dict-car-class/all');

export {
    ApiGetVerifyCode,
    ApiPostVerifyCodeCheck,
    ApiGetUserCarInfo,
    ApiPostUpdatePoint,
    ApiGetWorkStatus,
    ApiPostUpdateWorkStatus,
	ApiGetUserInfo,
	ApiGetCarInfo,
	ApiGetUserMoney,
	ApiGetDictCarClassAll
}
