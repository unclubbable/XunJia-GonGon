import { MsbRequest } from '../plugins/requset';

/**
 * @Description: 获取验证码
 * @param {*} passengerPhone
 * @return {*}
 */
const ApiGetVerifyCode = (data={passengerPhone}) => 
MsbRequest.post('/verification-code',data,{notVerifyToken:true})
/** 
 * @Description: 验证验证码
 * @param {*} passengerPhone
 * @param {*} verificationCode
 * @return {*}
 */
const ApiPostVerifyCodeCheck = (data={passengerPhone,verificationCode}) => 
MsbRequest.post('/verification-code-check',data,{notVerifyToken:true})

/**
 * @Description: 根据token获取乘客信息
 * @return {*}
 */
const ApiGetUserInfo = () => MsbRequest.get('/passenger-user');

/**
 * @Description: 根据用户id获取乘客信息
 * @return {*}
 */
const ApiPutUserInfo = (UserInfo) => MsbRequest.put('/passenger-user',UserInfo);


export {
    ApiGetVerifyCode,
    ApiPostVerifyCodeCheck,
    ApiGetUserInfo,
	ApiPutUserInfo
}