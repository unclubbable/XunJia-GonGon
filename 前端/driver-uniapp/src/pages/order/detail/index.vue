<template>
	<view class="detail-page">
		<view class="map-layer">
			<BWebSocket @receiveOrder="handleOrdermessage"/>
			<BMap ref="mapRef" :initial-view-mode="'2D'" :bottom-padding="280" locate-mode="order" />
		</view>
		<view class="nav-back" @click="handleBack">返回</view>
		<view class="operation">
			<view class="sheet-handle" />
		<!-- 行程中 -->
		<template v-if="orderDetail.orderStatus >= ORDER_STATUS.driverReceive && orderDetail.orderStatus <= ORDER_STATUS.tripFinish">
			<!-- WebSocket 已在页面顶层挂载 -->
			<view>
				<view class="tips">
					<view class="order_tips">
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.driverReceive">已接单</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.driverToPickUp">去接乘客</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.driverArriveStartPoint">到达起点</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.tripStart">服务中</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.tripFinish">行程已完成，请发起收款</text>
					</view>
					<view class="cancel_tips">
						<text v-if="remainingTime && (orderDetail.orderStatus < ORDER_STATUS.tripStart)">
							若您不接此单，可在<text style="color: red;">{{ remainingTime }}</text>之前免费取消
						</text>
						<text v-if="orderDetail.orderStatus >= ORDER_STATUS.tripStart">
							订单已无法取消，如需停止请直接点击到达
						</text>
					</view>
				</view>
				<!-- 乘客信息 -->
				<view class="passenger-info">
				  <view class="info-left">
					  <text v-if="orderDetail.passengerSurname" style="margin-right: 10px;">{{ orderDetail.passengerSurname }}先生</text>
					  <text v-if="orderDetail.passengerPhone">{{ orderDetail.passengerPhone }}</text>
					  <view v-if="orderDetail.orderStatus === ORDER_STATUS.tripFinish">
					  	<view class="driver-info">
							<view class="driveMile">
								<text>路程：</text>
								<text style="color: red;">{{ (orderDetail.driveMile / 1000).toFixed(2) }}</text>
								<text> 千米</text>
							</view>
							<view class="driveTime">
								<text>驾车时间：</text>
								<text style="color: red;">{{orderDetail.driveTime}}</text>
								<text> 分钟</text>
							</view>
						</view>
					  </view>
					  <view v-else class="route">
						<view class="start">
							<text>{{orderDetail.departure}}</text>    
						</view>
						<view class="end">  
							<text>{{orderDetail.destination}}</text>
						</view>
					  </view>
				  </view>
				  <view class="info-right">
					<image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
				  </view>
				</view>
				
				<view class="btn-content">
					<view style="width:45%">
						<button class="btn" v-if="orderDetail.orderStatus === ORDER_STATUS.driverReceive" @click="handleGrabOrder">去接乘客</button>
						<button class="btn" v-if="orderDetail.orderStatus === ORDER_STATUS.driverToPickUp" @click="handleToDeparture">到达起点</button>
						<button class="btn" v-if="orderDetail.orderStatus === ORDER_STATUS.driverArriveStartPoint" @click="handlePickUpPassenger">接到乘客</button>
						<button class="btn" v-if="orderDetail.orderStatus === ORDER_STATUS.tripStart" @click="handleTripFinish">到达目的地</button>
						<button class="btn" v-if="orderDetail.orderStatus === ORDER_STATUS.tripFinish" @click="handlePay">￥{{orderDetail.price}} 发起收款</button>	
					</view>
					<view style="width:45%">
						<!-- 取消订单按钮 -->
						<button @click="handleCancel" class="btn btn_cancel">取消订单</button>
					</view>
				</view>
		    </view>
		</template>
		<!-- 已完成 -->
		<template v-if="orderDetail.orderStatus === ORDER_STATUS.orderFinish">
			<view>
				<view class="desc">
					<text>您的行程已顺利结束</text>
				</view>
				<view class="passenger-info">
				  <view class="info-left">
					  <text v-if="orderDetail.passengerSurname" style="margin-right: 10px;">{{ orderDetail.passengerSurname }}先生</text>
					  <text v-if="orderDetail.passengerPhone">{{ orderDetail.passengerPhone }}</text>
					  <view class="route" style="margin-top: 10px;">
							<view class="start">
								<text>{{orderDetail.departure}}</text>    
							</view>
							<view class="end">  
								<text>{{orderDetail.destination}}</text>
							</view>
					  </view>
				  </view>
				  <view class="info-right">
					<image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
				  </view>
				</view>
				<view class="route-info">
					<view class="route-info-left">
						<view class="driveMile">
							<text>路程：</text>
							<text style="color: red;">{{ (orderDetail.driveMile / 1000).toFixed(2) }}</text>
							<text> 千米</text>
						</view>
						<view class="driveTime">
							<text>驾车时间：</text>
							<text style="color: red;">{{orderDetail.driveTime}}</text>
							<text> 分钟</text>
						</view>
					</view>
					<view class="price">
						<text style="color: red;">{{orderDetail.price}}</text>
						<text> 元</text>
					</view>
				</view>
				<button class="btn btn_ticket" @click="goOrderTicket">订单问题反馈</button>
			</view>
		</template>
		<!-- 待支付 -->
		<template v-if="orderDetail.orderStatus === ORDER_STATUS.awaitPay">
			<view>
				<view class="desc">
					<text>您的行程已顺利结束,请等待乘客付款</text>
				</view>
				<view class="passenger-info">
				  <view class="info-left">
					  <text v-if="orderDetail.passengerSurname" style="margin-right: 10px;">{{ orderDetail.passengerSurname }}先生</text>
					  <text v-if="orderDetail.passengerPhone">{{ orderDetail.passengerPhone }}</text>
					  <view class="route" style="margin-top: 10px;">
							<view class="start">
								<text>{{orderDetail.departure}}</text>    
							</view>
							<view class="end">  
								<text>{{orderDetail.destination}}</text>
							</view>
					  </view>
				  </view>
				  <view class="info-right">
					<image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
				  </view>
				</view>
				<view class="route-info">
					<view class="route-info-left">
						<view class="driveMile">
							<text>路程：</text>
							<text style="color: red;">{{ (orderDetail.driveMile / 1000).toFixed(2) }}</text>
							<text> 千米</text>
						</view>
						<view class="driveTime">
							<text>驾车时间：</text>
							<text style="color: red;">{{orderDetail.driveTime}}</text>
							<text> 分钟</text>
						</view>
					</view>
					<view class="price">
						<text style="color: red;">{{orderDetail.price}}</text>
						<text> 元</text>
					</view>
				</view>
			</view>
		</template>
		<!-- 已取消 -->
		<template v-if="orderDetail.orderStatus === ORDER_STATUS.orderCancel">
			<view>
				<view class="desc" style="height: 60rpx;line-height: 60rpx;">
					<text>您的订单已取消</text>
				</view>
				<view class="passenger-info">
				  <view class="info-left">
					  <text v-if="orderDetail.passengerSurname" style="margin-right: 10px;">{{ orderDetail.passengerSurname }}先生</text>
					  <text v-if="orderDetail.passengerPhone">{{ orderDetail.passengerPhone }}</text>
					  <view class="route" style="margin-top: 10px;">
							<view class="start">
								<text>{{orderDetail.departure}}</text>    
							</view>
							<view class="end">  
								<text>{{orderDetail.destination}}</text>
							</view>
					  </view>
				  </view>
				  <view class="info-right">
					<image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
				  </view>
				</view>
				<view class="price-info">
					<view class="cancal_price">
						<text>违约金：</text>
						<text style="color: red;">0</text>
						<text> 元</text>
					</view>
				</view>
				<button class="btn btn_cancel" style="margin-top: 10rpx;" disabled>去支付</button>
			</view>
		</template>
		</view>
	</view>
</template>
<script setup>
import { onLoad } from "@dcloudio/uni-app";
import { ApiGetCurrentOrder, ApiPostToPickUpPassenger, ApiPostOrderCancel, ApiPostOrderPayInfo, ApiPostPassengerOff, ApiPostPickUpPassenger, ApiPostToDeparture, ApiGetOrderDetail,ApiGetCurrentOrderDetail, ApiGetOrderTrack } from "../../../api/order"
import { HandleApiError, ShowToast } from "../../../utils";
import {ORDER_STATUS} from '../../../config/dicts'
import BWebSocket from '../../../component/BWebSocket.vue';
import BMap from '../../../component/BMap.vue';
import { useStore } from "vuex";
import { computed, onMounted, onUnmounted, ref, nextTick } from "vue";
import { _FormatDate } from "@gykeji/jsutil";
import { ApiPostUpdatePoint } from "../../../api/user";
// 调试轨迹数据（仅联调用；startUploadTask 默认注释）
import { data } from "../../dev/trackData";

let $routerQuery = {};
const $store = useStore();
const currentPoint = computed(()=> $store.state.point);
const userInfo = computed(() => $store.state.userInfo);
let orderDetail = ref({});
let mapRef = ref(null);
let remainingTime = ref("");
let pointTimer = null;

onLoad((option) => {
    $routerQuery = option;
});

onMounted(()=>{
	getCurrentOrderDetail();
})

onUnmounted(() => {
	if (pointTimer) {
		clearTimeout(pointTimer);
		pointTimer = null;
	}
})
function handleOrdermessage(arg){
	if(arg.code !=null && arg.code == 801){
		ShowToast("取消订单成功");
		uni.redirectTo({url:'/pages/home/index'});
	}
	
}
const getCurrentOrderDetail = async () =>{
	const {orderId: orderId} = $routerQuery;
    const {error, result} = await ApiGetCurrentOrderDetail({ orderId });
    if(!result.hasOwnProperty("code") && result !=null){
		orderDetail.value = result;
		const orderTime = new Date(orderDetail.value.receiveOrderTime);
		// 加2分钟
		orderTime.setMinutes(orderTime.getMinutes() + 2);
		// 格式化时间为 HH:mm:ss
		const formattedTime = `${String(orderTime.getHours()).padStart(2, '0')}:${String(orderTime.getMinutes()).padStart(2, '0')}:${String(orderTime.getSeconds()).padStart(2, '0')}`;
		remainingTime.value = formattedTime;
		
		let driverPositionLon = null;
		let driverPositionLat = null;
		switch (result.orderStatus) {
		  case ORDER_STATUS.driverReceive:
		  case ORDER_STATUS.driverToPickUp:
		    driverPositionLon = result.receiveOrderCarLongitude;
		    driverPositionLat = result.receiveOrderCarLatitude;
		    break;
		  case ORDER_STATUS.driverArriveStartPoint:
		    driverPositionLon = result.depLongitude;
		    driverPositionLat = result.depLatitude;
		    break;
		  case ORDER_STATUS.tripStart:
			driverPositionLon = result.depLongitude;
			driverPositionLat = result.depLatitude;
			uni.getLocation({
				type: 'gcj02',
				geocode: true,
				success (res) {
				  driverPositionLon = res.longitude;
				  driverPositionLat = res.latitude;
				},
				fail(err) {
				    console.error('获取位置信息失败:', err);
				}
			});
		    break;
		  case ORDER_STATUS.tripFinish:
		    driverPositionLon = result.destLongitude;
		    driverPositionLat = result.destLatitude;
		    break;
		  default:
		    // 处理默认情况
			driverPositionLon = result.destLongitude;
			driverPositionLat = result.destLatitude;
		    break;
		}
		nextTick(()=>{
			if(result.orderStatus>=ORDER_STATUS.driverReceive && result.orderStatus<ORDER_STATUS.tripFinish){
				mapDrivingAndMakerDriverPosition([result.depLongitude, result.depLatitude], [result.destLongitude, result.destLatitude],
																		driverPositionLon,driverPositionLat);
			}else if(result.orderStatus>=ORDER_STATUS.tripFinish && result.orderStatus!==ORDER_STATUS.orderCancel){
				loadOrderTrack(result)
			}else if(result.orderStatus===ORDER_STATUS.orderCancel){
				mapMarkerDepAndDestPosition([result.depLongitude, result.depLatitude], [result.destLongitude, result.destLatitude])
			}
		})
		// 订单进行中持续上报位置（含派单/乘客实时位置）
		if (result.orderStatus >= ORDER_STATUS.driverReceive && result.orderStatus < ORDER_STATUS.tripFinish) {
			updatePoint();
		}
		
    }else{
		// 司机端无 tabBar，回首页用 redirectTo
		uni.redirectTo({url:'/pages/home/index'});
    }
}

/**
 * 行程结束后回放实际上报轨迹（与管理端同款：上报点 + 上车/下车节点）
 */
const loadOrderTrack = async (order) => {
	if (!order || !order.id) return
	const draw = (trackPayload) => {
		if (!mapRef.value || !mapRef.value.drawOrderTrack) {
			setTimeout(() => draw(trackPayload), 500)
			return
		}
		if (mapRef.value.setFollow) {
			mapRef.value.setFollow(false)
		}
		mapRef.value.drawOrderTrack(trackPayload)
	}
	try {
		const { error, result } = await ApiGetOrderTrack({ orderId: order.id })
		if (error || !result) {
			console.warn('轨迹接口失败', error)
			draw({
				trip: order,
				trackPoints: []
			})
			return
		}
		const trackPoints = result.points || []
		if (result.tip) {
			console.info('[order-track]', result.tip, 'points=', trackPoints.length)
		}
		draw({
			trip: {
				depLongitude: result.depLongitude,
				depLatitude: result.depLatitude,
				destLongitude: result.destLongitude,
				destLatitude: result.destLatitude,
				receiveOrderCarLongitude: result.receiveOrderCarLongitude,
				receiveOrderCarLatitude: result.receiveOrderCarLatitude,
				toPickUpPassengerLongitude: result.toPickUpPassengerLongitude,
				toPickUpPassengerLatitude: result.toPickUpPassengerLatitude,
				pickUpPassengerLongitude: result.pickUpPassengerLongitude,
				pickUpPassengerLatitude: result.pickUpPassengerLatitude,
				passengerGetoffLongitude: result.passengerGetoffLongitude,
				passengerGetoffLatitude: result.passengerGetoffLatitude
			},
			trackPoints,
			trackMeta: {
				rawPointCount: result.rawPointCount,
				pointCount: result.pointCount,
				driveMile: result.driveMile,
				driveTime: result.driveTime
			}
		})
	} catch (e) {
		console.error('加载轨迹失败', e)
		draw({ trip: order, trackPoints: [] })
	}
}

/**
 * 标记起点终点位置
 */
const mapMarkerDepAndDestPosition = (dep,dest)=>{
    if(!mapRef.value || !mapRef.value.markerDepDestPosition){
        setTimeout(()=>{
            mapMarkerDepAndDestPosition(dep,dest)
        }, 500)
        return false;
    }
    mapRef.value.markerDepDestPosition(dep,dest);
}
/**
 * 绘制驾车路线,标记接单司机位置
 */
const mapDrivingAndMakerDriverPosition = (dep,dest,driverLon,driverLat)=>{
    if(!mapRef.value ||!mapRef.value.driving){
        setTimeout(()=>{
            mapDrivingAndMakerDriverPosition(dep,dest,driverLon,driverLat)
        }, 500)
        return false;
    }
    if (mapRef.value.setFollow) {
        mapRef.value.setFollow(true)
    }
    mapRef.value.driving(dep,dest,driverLon,driverLat);
}

const handleBack = () => {
	const pages = getCurrentPages()
	if (pages.length > 1) {
		uni.navigateBack()
	} else {
		uni.redirectTo({ url: '/pages/home/index' })
	}
}

/**
 * 对本单提交工单反馈
 */
const goOrderTicket = () => {
	const id = orderDetail.value?.id || orderDetail.value?.orderId
	if (!id) {
		ShowToast('订单信息不完整')
		return
	}
	uni.navigateTo({
		url: `/pages/ticket/create/index?orderId=${id}&category=ORDER_ISSUE`
	})
}

/**
 * 取消订单
 */
const handleCancel = async () =>{
    const {error, result} = await ApiPostOrderCancel({orderId: orderDetail.value.id});
    if(!HandleApiError(error) && result && !Object.prototype.hasOwnProperty.call(result, 'code')){
		ShowToast("取消订单成功");
        uni.redirectTo({url:'/pages/home/index'});
    }else{
    	ShowToast((result && result.message) || '取消失败');
    }
}

/**
 * 去接乘客
 */
const handleGrabOrder = async (item)=>{
    const {error, result} = await ApiPostToPickUpPassenger({
        orderId: orderDetail.value.id,
        toPickUpPassengerTime: _FormatDate(new Date(), 'yyyy-mm-dd hh:ii:ss'),
        toPickUpPassengerLongitude: currentPoint.value.lng,
        toPickUpPassengerLatitude: currentPoint.value.lat,
        toPickUpPassengerAddress: currentPoint.value.name
    });
    if(!HandleApiError(error)){
        orderDetail.value.orderStatus = ORDER_STATUS.driverToPickUp;
    }
}
/**
 * @Description: 到达约定点
 * @return {*}
 */
const handleToDeparture = async () => {
    const {error, result} = await ApiPostToDeparture({
        orderId: orderDetail.value.id
    });
    if(!HandleApiError(error)){
        orderDetail.value.orderStatus = ORDER_STATUS.driverArriveStartPoint;
		mapRef.value.driverUpdatePosition(orderDetail.value.depLongitude, orderDetail.value.depLatitude);
    }
}
/**
 * @Description: 接到乘客，开始行程
 * @return {*}
 */
const handlePickUpPassenger = async ()=>{
    const {error, result} = await ApiPostPickUpPassenger({
         orderId: orderDetail.value.id,
         pickUpPassengerLongitude: currentPoint.value.lng,
         pickUpPassengerLatitude: currentPoint.value.lat
    });
    if(!HandleApiError(error)){
        orderDetail.value.orderStatus = ORDER_STATUS.tripStart;
		// ===== 测试专用：模拟轨迹上报（测完记得注释掉）（不要删去，当前在开发阶段）
		if (pointTimer) {
	       clearTimeout(pointTimer);
	       pointTimer = null;
		}
		startUploadTask();
    }

}

// 行程结束
const handleTripFinish = async ()=>{
    const res = await ApiPostPassengerOff({
        orderId: orderDetail.value.id,
        // 测试使用的最后位置  
        // passengerGetoffLongitude: '119.541341',
        // passengerGetoffLatitude: '35.454809'
        passengerGetoffLongitude: currentPoint.value.lng,
        passengerGetoffLatitude: currentPoint.value.lat
    });
	
	let {error} = res;
    if(HandleApiError(error)){
        return false;
    }
	if (pointTimer) {
		clearTimeout(pointTimer);
		pointTimer = null;
	}
    const {error:detailError, result} = await ApiGetCurrentOrderDetail({
        orderId: orderDetail.value.id,
    });
    if(HandleApiError(detailError)){
        return false
    }
    orderDetail.value = result;
	loadOrderTrack(result)
}

const handlePay = async () =>{
    const {error:er} = await ApiPostOrderPayInfo({
        orderId: orderDetail.value.id,
        price: orderDetail.value.price,
        passengerId: orderDetail.value.passengerId
    });
    if(!HandleApiError(er)){
        ShowToast('收款发起成功，请等待乘客付款');
        uni.redirectTo({url:'/pages/home/index'})
    }

}
/**
 * @Description: 模拟车辆行驶上报位置。每 5 秒上传一个，直到 list 坐标上报完
 * 测试时方便使用；轨迹数据见 pages/dev/trackData.js
 * 正式流程请保持 startUploadTask() 注释状态，勿改为默认开启
 * @return {*}
 */
 
const list = data
let currentIndex = 0;
let intervalId = null;

const startUploadTask = () => {
  intervalId = setInterval(testUpdatePoint, 5000);
  const minutes = (list.length * 5 / 60).toFixed(2);
  console.log("开始行程，正在上报坐标，当前有" + list.length + "个坐标," + "大概需要上传" 
  + minutes + "分钟，" + "请耐心等待！")
};

const testUpdatePoint = () => {
  if (currentIndex >= list.length) {
    clearInterval(intervalId);
    console.log("坐标点上传完毕，可以结束行程了！")
    return;
  }
  const point = list[currentIndex];
  const time = new Date().getTime();
  ApiPostUpdatePoint({
	"orderId": orderDetail.value.id,
    "carId": orderDetail.value.carId,
    "points": [
      {
        "location": point.location,
        "locatetime": time
      }
    ]
  });
  const center = point.location.split(",");
  mapRef.value.driverUpdatePosition(center[0], center[1]);
  currentIndex++;
};



/**
 * 订单页持续上报司机实时位置（每5秒）
 */
const updatePoint = () => {
	uni.getLocation({
		type: 'gcj02',
		geocode: true,
		success: async (result) => {
			const { error } = await ApiPostUpdatePoint({
				orderId: orderDetail.value.id,
				carId: orderDetail.value.carId || userInfo.value.carId,
				points: [{
					location: `${result.longitude},${result.latitude}`,
					locatetime: new Date().getTime()
				}]
			});
			if (!error) {
				$store.commit('setPoint', { lng: result.longitude, lat: result.latitude, name: result.city });
				mapRef.value?.driverUpdatePosition(result.longitude, result.latitude);
			}
			pointTimer = setTimeout(updatePoint, 5000);
		},
		fail(err) {
			console.error('位置上报失败:', err);
			pointTimer = setTimeout(updatePoint, 5000);
		}
	});
};

</script>
<style lang="scss" scoped>
.detail-page {
	position: relative;
	width: 100%;
	height: 100vh;
	overflow: hidden;
	background: #e8eef5;
}
.map-layer {
	position: absolute;
	inset: 0;
	z-index: 1;
}
.nav-back {
	position: fixed;
	left: 24rpx;
	top: calc(var(--status-bar-height, 20px) + 12px);
	z-index: 30;
	background: rgba(255, 255, 255, 0.96);
	padding: 12rpx 22rpx;
	border-radius: 999rpx;
	box-shadow: 0 6rpx 20rpx rgba(15, 35, 52, 0.12);
	font-size: $uni-font-size-sm;
	color: $uni-text-color;
	border: 1px solid rgba(232, 236, 240, 0.95);
}
.operation {
  position: fixed;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  width: 100%;
  max-height: 62vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 28rpx 28rpx 0 0;
  z-index: 9;
  padding: 12rpx $uni-spacing-row-max 40rpx;
  box-shadow: 0 -8rpx 32rpx rgba(15, 35, 52, 0.1);
  border-top: 1px solid rgba(232, 236, 240, 0.9);
}

.sheet-handle {
	width: 72rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background: #d9dee5;
	margin: 4rpx auto 12rpx;
}

.desc{
    height: 80rpx;
    line-height: 80rpx;
    font-size: 36rpx;
    font-weight: bold;
}

.tips{
	height: 100rpx;
}

.tips .order_tips{
	height: 60rpx;
	line-height: 60rpx;
	font-size: 36rpx;
	font-weight: bold;
}

.tips .cancel_tips{
	height: 40rpx;
	line-height: 40rpx;
	font-size: 26rpx;
	color: rgb(21 19 19 / 70%);
}

.passenger-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 180rpx;
  color: rgb(21 19 19 / 70%);
  font-weight: bold;
  padding: 12rpx 8rpx;
  background: #f7f9fc;
  border-radius: 16rpx;
}

.info-right{
	margin-right: 20rpx;
}

.route{
	color: #666;
	font-size: 26rpx;
	margin-top: 10px;
}
.route-info{
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 10rpx;
}
.route-info .price{
	font-size: 42rpx;
	margin-right: 20rpx;
	font-weight: bold;
}

.price-info .cancal_price{
	height: 60rpx;
	line-height: 60rpx;
	font-size: 32rpx;
}

.start{
	height: 50rpx;
	font-weight: 550;
	display: flex;
	align-items: center;
	&::before{
		display: block;
		content: '';
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: $uni-color-primary;
		margin-right: 10px;
		box-shadow: 0 0 0 6rpx rgba(49, 142, 255, 0.18);
	}
}

.end{
	height: 50rpx;
	display: flex;
	font-weight: 550;
	align-items: center;
	&::before{
		display: block;
		content: '';
		width: 16rpx;
		height: 16rpx;
		border-radius: 50%;
		background: $uni-color-warning;
		margin-right: 10px;
	}
}

.passenger-info .avatar {
	display: block;
	width: 150rpx;
	height: 150rpx;
	border-radius: 50%; 
}

.btn-content{
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
}

.driveMile,.driveTime{
	height: 60rpx;
	line-height: 60rpx;
	font-size: 32rpx;
}

.btn{
    font-size: $uni-font-size-lg;
    margin-top: $uni-spacing-max;
    background: $uni-color-primary;
    color: $uni-text-color-inverse;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 16rpx;
    &__cancel{
        background: #f3f6fa;
        color: $uni-text-color;
        border: 1px solid #e8ecf0;
    }
	&_ticket{
		background: #fff;
		color: $uni-color-primary;
		border: 1px solid $uni-color-primary;
	}
    &::after{
        display: none;
    }
}

</style>