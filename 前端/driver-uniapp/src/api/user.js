import { MsbRequest } from '../plugins/requset';

/**
 * @Description: 获取验证码
 * @param {*} passengerPhone
 * @return {*}
 */
function ApiGetVerifyCode({driverPhone}){ 
	return MsbRequest.post('/verification-code',{driverPhone},{notVerifyToken:true})
}
/** 
 * @Description: 验证验证码
 * @param {*} passengerPhone
 * @param {*} verificationCode
 * @return {*}
 */
function ApiPostVerifyCodeCheck ({driverPhone,verificationCode}) {
	return MsbRequest.post('/verification-code-check',
		{driverPhone,verificationCode,},
		{notVerifyToken:true},
		)
}
/**
 * @Description: 根据token获取司机车辆信息
 * @return {*}
 */
const ApiGetUserCarInfo = () => MsbRequest.get('/driver-car-binding-relationship');

/**
 * @description 获取司机信息
 */
const ApiGetUserInfo = (driver_id) => MsbRequest.get('/get-driver-info/' + driver_id)

/**
 * 轨迹点上传
 * @param {*} data 
 * @returns 
 */
const ApiPostUpdatePoint = (data = {carId, points}) => MsbRequest.post('/point/upload', data);

/**
 * 获取司机工作状态
 * @param {*} params 
 * @returns 
 */
const ApiGetWorkStatus = (params = {driverId}) => MsbRequest.get('/work-status', params);

/**
 * 更新司机工作状态
 * @param {*} data 
 * @returns 
 */
const ApiPostUpdateWorkStatus = (data = {driverId, workStatus}) => MsbRequest.post('/driver-user-work-status', data)

/**
 * 更新司机工作城市
 * @param {*} data 
 * @returns 
 */
const ApiPostUpdateWorkCity = (data = {driverId,citycode,adname,adcode}) => MsbRequest.post('/driver-user-work-city', data)

/**
 * 获取司机最近三月的收入信息
 * @param {*} data 
 * @returns 
 */
const ApiGetUserMoney = (driverId,RecentlyMonth) => MsbRequest.get('/driver-user-money/'+driverId+'/'+RecentlyMonth)


/**
 * 更新司机工作城市
 * @param {*} data 
 * @returns 
 */
const ApiGetCarInfo = (cid) => MsbRequest.get('/get-car/'+ cid)
export {
    ApiGetVerifyCode,
    ApiPostVerifyCodeCheck,
    ApiGetUserCarInfo,
    ApiPostUpdatePoint,
    ApiGetWorkStatus,
    ApiPostUpdateWorkStatus,
	ApiGetUserInfo,
	ApiPostUpdateWorkCity,
	ApiGetCarInfo,
	ApiGetUserMoney
}