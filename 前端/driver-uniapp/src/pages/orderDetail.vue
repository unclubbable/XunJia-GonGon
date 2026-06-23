<template>
    <view class="wrapper">
        <BSseMessage @receiveOrder="handleOrdermessage"/>
        <BMap ref="mapRef"/>
    </view>
	<view class="operation">
		<!-- 行程中 -->
		<template v-if="orderDetail.orderStatus >= ORDER_STATUS.driverReceive && orderDetail.orderStatus <= ORDER_STATUS.tripFinish">
			<!-- <BSseMessage @receiveMsg="handleReceiveMsg"/> -->
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
</template>
<script setup>
import { onLoad } from "@dcloudio/uni-app";
import { ApiGetCurrentOrder, ApiPostToPickUpPassenger, ApiPostOrderCancel, ApiPostOrderPayInfo, ApiPostPassengerOff, ApiPostPickUpPassenger, ApiPostToDeparture, ApiGetOrderDetail,ApiGetCurrentOrderDetail } from "../api/order"
import { HandleApiError, ShowToast } from "../utils";
import {ORDER_STATUS} from '../config/dicts'
import BSseMessage from '../component/BSseMessage.vue';
import BMap from '../component/BMap.vue';
import { useStore } from "vuex";
import { computed, onMounted, ref, nextTick } from "vue";
import { _FormatDate } from "@gykeji/jsutil";
import { ApiPostUpdatePoint } from "../api/user";
import { data } from "./data";

let $routerQuery = {};
const $store = useStore();
const currentPoint = computed(()=> $store.state.point);
let orderDetail = ref({});
let mapRef = ref(null);
let remainingTime = ref("");

onLoad((option) => {
    $routerQuery = option;
});

onMounted(()=>{
	getCurrentOrderDetail();
})
function handleOrdermessage(arg){
	if(arg.code !=null && arg.code == 801){
		ShowToast("取消订单成功");
		uni.redirectTo({url:'/pages/index'});
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
			// 设置默认值
			driverPositionLon = result.depLongitude;
			driverPositionLat = result.depLatitude;
		    // TODO 获取当前位置
			uni.getLocation({
				type: 'gcj02',
				geocode: true,
				// 成功则为当前位置
				success (res) {
				  // console.log(JSON.stringify(res))
				  const { longitude,latitude } = res;
				  driverPositionLon = longitude;
				  driverPositionLat = latitude;
				},
				// 失败则暂时使用默认值默认为起点，司机马上会推送以司机为基础的准确坐标
				fail(err) {
				    console.error('获取位置信息失败:', err);
				}
			});
			// updatePoint() 开始上报坐标
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
			if(result.orderStatus>=ORDER_STATUS.driverReceive && result.orderStatus<=ORDER_STATUS.tripFinish){
				mapDrivingAndMakerDriverPosition([result.depLongitude, result.depLatitude], [result.destLongitude, result.destLatitude],
																		driverPositionLon,driverPositionLat);
			}else if(result.orderStatus>=ORDER_STATUS.awaitPay){
				mapMarkerDepAndDestPosition([result.depLongitude, result.depLatitude], [result.destLongitude, result.destLatitude])
			}
		})
		
    }else{
		uni.switchTab({url:'/pages/index/index'});
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
    mapRef.value.driving(dep,dest,driverLon,driverLat);
}

/**
 * 取消订单
 */
const handleCancel = async () =>{
    const {error, result} = await ApiPostOrderCancel({orderId: orderDetail.value.id});
    if(!HandleApiError(error) && !result.hasOwnProperty("code")){
		ShowToast("取消订单成功");
        uni.redirectTo({url:'/pages/index'});
    }else{
    	ShowToast(result.message);
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
        // 模拟车辆行驶，上报位置
        // startUploadTask();
		// 真实行驶
        updatePoint();
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
	mapRef.value.driverUpdatePosition(orderDetail.value.destLongitude, orderDetail.value.destLatitude);
    const {error:detailError, result} = await ApiGetCurrentOrderDetail({
        orderId: orderDetail.value.id,
    });
    if(HandleApiError(detailError)){
        return false
    }
    orderDetail.value = result;
}

const handlePay = async () =>{
    const {error:er} = await ApiPostOrderPayInfo({
        orderId: orderDetail.value.id,
        price: orderDetail.value.price,
        passengerId: orderDetail.value.passengerId
    });
    if(!HandleApiError(er)){
        ShowToast('收款发起成功，请等待乘客付款');
        uni.redirectTo({url:'/pages/index'})
    }

}
/**
 * @Description: 模拟车辆行驶上报位置。每两秒上传一个，直到list坐标上报完
 * 测试时方便使用, list数据在项目python文件构造，会生成data.json,复制文件到当前目录即可
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
 * 行程中每五秒上传位置
 */
const updatePoint = ()=>{
	uni.getLocation({
		type: 'gcj02',
		geocode: true,
		success:async  (result) =>{
			const {error} = await ApiPostUpdatePoint({
				carId: userInfo.value.carId,
				points: [{
					location: `${result.longitude},${result.latitude}`,
					locatetime: new Date().getTime()
				}]
			});
			if(!error){
				$store.commit('setPoint',{ lng:result.longitude, lat:result.latitude, name:result.city});
				mapRef.value.driverUpdatePosition(result.longitude, result.latitude);
			}
			setTimeout(()=>{
				updatePoint()
			}, 5000)
		}
	});
}

</script>
<style lang="scss" scoped>

.wrapper {
    width: 100%;
    height: calc(100vh - 475rpx);
}
.operation {
  position: fixed;
  bottom: 0;
  box-sizing: border-box;
  width: 100%;
  height: 480rpx;
  background: $uni-bg-color;
  border-radius: $uni-border-radius-lg $uni-border-radius-lg 0 0;
  z-index: 9;
  padding: $uni-spacing-row-max;
  padding-bottom: 40rpx;
  box-shadow: 0 3rpx 5rpx 5rpx #ccc;
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
  align-items: center; /* 让内容垂直居中 */
  height: 200rpx;
  color: rgb(21 19 19 / 70%);
  font-weight: bold;
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
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: #19c235;
		margin-right: 10px;
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
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: #f0ad4e;
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
	height: 80rpx;
	line-height: 80rpx;
    &__cancel{
        background: $uni-bg-color-grey;
        color: $uni-text-color;
        border: 1px solid $uni-border-color;
    }
    &::after{
        display: none;
    }
}

</style>