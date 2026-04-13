import { MsbRequest } from "../plugins/requset";

// const ApiGetUserProgressOrder = () => MsbRequest.get("/UserProgressOrder");

/**
 * @Description: 预估
 * @param {*} 
 * @return {*}
 */
const ApiGetPrice = (
  params = {
    depLongitude, //城市编码
    depLatitude, //出发地纬度
    destLongitude, //目的地纬度
    destLatitude, //目的地纬度
    cityCode, //城市编码
    vehicleType, //车辆类型
  }
) => MsbRequest.post("/forecast-price", params);

/**
 * @Description:乘客下单
 * @return {*}
 */
const ApiPostOrderAdd = (
  data = {
    address,
    departTime,
    orderTime,
    departure,
    depLongitude,
    depLatitude,
    destination,
    destLongitude,
    destLatitude,
    encrypt,
    fareType,
    fareVersion,
    passengerId,
    passengerPhone,
    vehicleType,
  }
) => MsbRequest.post("/order/add", data);

/**
 * @Description: 乘客取消订单
 * @param {*} orderId
 * @return {*}
 */
const ApiPostOrderCancel = ({orderId}) => MsbRequest.post('/order/cancel',{orderId},{
  'content-type':'application/x-www-form-urlencoded'
});
/**
 * @Description: 判断用户是否有正在进行的订单
 * @return {*}
 */
const ApiGetCurrentOrder = () => MsbRequest.get('/order/current');

/**
 * 通过id获取当前订单详情
 */
const ApiGetCurrentOrderDetail = ({orderId}) =>MsbRequest.get('/order/current-order-detail',{orderId});

/**
 * 获取当前所有订单信息
 */

const ApiGetAllOrderInfo = () =>MsbRequest.get('/order/get-all-orders', null, { repeat: false });

export { 
    ApiGetPrice, 
    ApiPostOrderAdd,
    ApiPostOrderCancel,
    ApiGetCurrentOrder,
	ApiGetCurrentOrderDetail,
	ApiGetAllOrderInfo 
};
