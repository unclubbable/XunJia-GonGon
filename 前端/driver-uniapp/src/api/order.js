import { MsbRequest } from "../plugins/requset";

const ApiGetOrderDetail = (data= {orderId}) => MsbRequest.get('/order/detail',data);

/**
 * 通过id获取当前订单详情
 */
const ApiGetCurrentOrderDetail = ({orderId}) =>MsbRequest.get('/order/current-order-detail',{orderId});

const ApiPostOrderCancel = ({orderId}) => MsbRequest.post('/order/cancel',{orderId},{
  'content-type':'application/x-www-form-urlencoded'
});

/**
 * 获取当前所有订单信息
 */
const ApiGetAllOrderInfo = () =>MsbRequest.get('/order/get-all-orders', null, { repeat: false });

/**
 * @Description: 去接乘客
 * @param {*} orderId 订单ID
 * @param {*} toPickUpPassengerTime 出发时间
 * @param {*} toPickUpPassengerLongitude 出发经度
 * @param {*} toPickUpPassengerLatitude 出发纬度
 * @param {*} toPickUpPassengerAddress 出发地址
 * @return {*}
 */
const ApiPostToPickUpPassenger = (data = {orderId,toPickUpPassengerTime,toPickUpPassengerLongitude,toPickUpPassengerLatitude,toPickUpPassengerAddress}) => MsbRequest.post('/order/to-pick-up-passenger',data);

/**
 * @Description: 到达上车点
 * @param {*} orderId 订单ID
 * @return {*}
 */
// const ApiPostToDeparture = function(data = {orderId}){
//   return MsbRequest.post('/order/arrived-departure', data);
// }
const ApiPostToDeparture = (data = {orderId}) => MsbRequest.post('/order/arrived-departure', data)

/**
 * @Description: 接到乘客
 * @param {*} orderId 
 * @param {*} pickUpPassengerLongitude
 * @param {*} pickUpPassengerLatitude
 * @return {*}
 */
const ApiPostPickUpPassenger = (data = { orderId, pickUpPassengerLongitude, pickUpPassengerLatitude}) => MsbRequest.post('/order/pick-up-passenger', data)

/**
 * @Description: 到达目的地
 * @param {*} data
 * @param {*} passengerGetoffLongitude
 * @param {*} passengerGetoffLatitude
 * @return {*}
 */
const ApiPostPassengerOff = (data = { orderId, passengerGetoffLongitude, passengerGetoffLatitude}) => MsbRequest.post('/order/passenger-getoff', data)

/**
 * 支付
 * @param {*} data 
 * @returns 
 */
const ApiPostOrderPayInfo = (data = {orderId, price, passengerId}) => MsbRequest.post('/order/push-pay-info',data, {
  "content-type" : 'application/x-www-form-urlencoded'
})

/**
 * 获取当前订单信息
 * @returns 
 */
const ApiGetCurrentOrder = () => MsbRequest.get('/order/current')

// 函数导出，可在其他地方import
export {
  ApiGetOrderDetail,
  ApiPostOrderCancel,
  ApiPostToPickUpPassenger,
  ApiPostToDeparture,
  ApiPostPickUpPassenger,
  ApiPostPassengerOff,
  ApiPostOrderPayInfo,
  ApiGetCurrentOrder,
  ApiGetCurrentOrderDetail,
  ApiGetAllOrderInfo
}