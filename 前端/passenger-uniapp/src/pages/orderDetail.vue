<template>
    <view class="wrapper">
        <BMap ref="mapRef"/>
	</view>
	<view class="operation">
		<!-- 待接单 -->
		<template v-if="orderDetail.orderStatus === ORDER_STATUS.orderStart">
			<BSseMessage @receiveMsg="handleReceiveMsg"/>
			<view class="calling_driver">
				<view class="desc" style="font-weight: normal;">
					<text>正在为您全力呼叫司机</text>
					<text class="dotting"></text>
				</view>
				<view class="route">
					<view class="start">
					    <text>{{orderDetail.departure}}</text>    
					</view>
					<view class="end">  
						<text>{{orderDetail.destination}}</text>
					</view>
				</view>
				<button class="btn btn__cancel" @click="handleCancel" style="width: 100%;">取消用车</button>
			</view>
		</template>
		<!-- 待支付 -->
		<template v-if="orderDetail.orderStatus === ORDER_STATUS.awaitPay">
			<view>
				<view class="desc">
					<text>您的行程已结束，请您尽快完成支付</text>
				</view>
				<view class="order_info">
					<view class="route">
						<view class="start">
						    <text>{{orderDetail.departure}}</text>    
						</view>
						<view class="end">  
							<text>{{orderDetail.destination}}</text>
						</view>
					</view>
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
				<button @click="handlePay" class="btn">￥{{orderDetail.price}} 立即支付</button>
			</view>
		</template>
		<!-- 行程中 -->
		<template v-if="orderDetail.orderStatus >= ORDER_STATUS.driverReceive && orderDetail.orderStatus <= ORDER_STATUS.tripFinish">
			<BSseMessage @receiveMsg="handleReceiveMsg"/>
			<view>
				<view class="tips">
					<view class="order_tips">
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.driverReceive">司机已接单</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.driverToPickUp">司机正在赶来的路上</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.driverArriveStartPoint">司机到达上车点</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.tripStart">司机正在为您服务</text>
						<text v-if="orderDetail.orderStatus === ORDER_STATUS.tripFinish">行程已完成，请等待司机发起收款</text>
					</view>
					<view class="cancel_tips">
						<text v-if="remainingTime && (orderDetail.orderStatus < ORDER_STATUS.tripStart)">
							若您改变行程，可在<text style="color: red;">{{ remainingTime }}</text>之前免费取消
						</text>
						<text v-if="orderDetail.orderStatus >= ORDER_STATUS.tripStart">
							订单已无法取消，请联系司机结束订单
						</text>
					</view>
				</view>
				<!-- 司机信息 -->
				<view class="driver-info">
				  <view class="info-left">
				    <view class="license-plate">
				      <text>{{ orderDetail.vehicleNo }}</text>
				    </view>
					<view class="car" v-if="orderDetail.vehicleBrand">
					  <text>{{ orderDetail.vehicleBrand }}</text>
					  <text>{{ orderDetail.vehicleModel }}</text>
					  <text>·</text>
					  <text>{{ getVehicleColorText(orderDetail.vehicleColor) }}</text>
					</view>
				    <view class="driver">
				      <text v-if="orderDetail.driverSurname">{{ orderDetail.driverSurname }}师傅</text>
					  <text style="margin-left: 20rpx;" v-if="orderDetail.driverTotalOrders">{{ orderDetail.driverTotalOrders }}单</text>
				    </view>
				    <view class="phone-number">
				      <text v-if="orderDetail.driverPhone">{{ orderDetail.driverPhone }}</text>
				    </view>
				  </view>
				  <view class="info-right">
				    <image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
				  </view>
				</view>
				<!-- 取消订单按钮 -->
				<button @click="handleCancel" class="btn btn_cancel">取消订单</button>
			</view>
		</template>
		<!-- 已完成 -->
		<template v-if="orderDetail.orderStatus === ORDER_STATUS.orderFinish">
			<view>
				<view class="desc">
					<text>您的行程已顺利结束</text>
				</view>
				<view class="driver-info" style="height:140rpx; margin-top: 0;">
				  <view class="info-left">
				    <view class="license-plate">
				      <text>{{ orderDetail.vehicleNo }}</text>
				    </view>
					<!-- <view class="car" v-if="orderDetail.vehicleBrand">
					  <text>{{ orderDetail.vehicleBrand }}</text>
					  <text>{{ orderDetail.vehicleModel }}</text>
					  <text>·</text>
					  <text>{{ getVehicleColorText(orderDetail.vehicleColor) }}</text>
					</view> -->
				    <view class="driver">
				      <text v-if="orderDetail.driverSurname">{{ orderDetail.driverSurname }}师傅</text>
					  <text v-if="orderDetail.driverPhone" style="margin-left: 20rpx;">{{ orderDetail.driverPhone }}</text>
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
				<button class="btn btn_cancel">去评价</button>
			</view>
		</template>
		<!-- 已取消 -->
		<template v-if="orderDetail.orderStatus === ORDER_STATUS.orderCancel">
			<view>
				<view class="desc">
					<text>您的订单已取消</text>
				</view>
				<view class="driver-info" style="margin-top: 0;">
				  <view class="info-left">
				    <view class="license-plate">
				      <text>{{ orderDetail.vehicleNo }}</text>
				    </view>
					<view class="car" v-if="orderDetail.vehicleBrand">
					  <text>{{ orderDetail.vehicleBrand }}</text>
					  <text>{{ orderDetail.vehicleModel }}</text>
					  <text>·</text>
					  <text>{{ getVehicleColorText(orderDetail.vehicleColor) }}</text>
					</view>
				    <view class="driver">
				      <text v-if="orderDetail.driverSurname">{{ orderDetail.driverSurname }}师傅</text>
					  <text v-if="orderDetail.driverPhone" style="margin-left: 20rpx;">{{ orderDetail.driverPhone }}</text>
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
				<button class="btn btn_cancel" disabled>去支付</button>
			</view>
		</template>
	</view>
</template>
<script setup>
import { onLoad } from "@dcloudio/uni-app"
import { ApiGetCurrentOrderDetail, ApiPostOrderCancel } from "../api/order"
import { HandleApiError, ShowToast } from "../utils";
import { ORDER_STATUS } from '../config/dicts';
import BSseMessage from '../component/BSseMessage.vue';
import BMap from '../component/BMap.vue';
import { onMounted, ref, nextTick } from "vue";

let $routerQuery = {};
let orderDetail = ref({});
let mapRef = ref(null);
let remainingTime = ref("");

onLoad((option)=>{
    $routerQuery = option;
});
onMounted(()=>{
	getCurrentOrderDetail();
})
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

const getVehicleColorText = (num) =>{
	switch (num){
		case "1":
			return "白色";
		case "2":
			return "黑色";
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
 * @Description: 取消订单
 * @return {*}
 */
const handleCancel = async () =>{
    const {error, result} = await ApiPostOrderCancel({orderId: orderDetail.value.id});
    if(!HandleApiError(error) && !result.hasOwnProperty("code")){
        uni.switchTab({url:'/pages/index/index'});
    }else{
		ShowToast(result.message);
	}
}
/**
 * @Description: 点击支付，跳转到支付网页；
 * @return {*}
 */
const handlePay = () =>{
	console.log(orderDetail.value);
    if(orderDetail.value.id != null || orderDetail.value.id != undefined){
		uni.navigateTo({
		    url : `/pages/pay?id=${orderDetail.value.id}&price=${orderDetail.value.price}`
		})
	}
	if(orderDetail.value.orderId != null || orderDetail.value.orderId != undefined){
		uni.navigateTo({
		    url : `/pages/pay?id=${orderDetail.value.orderId}&price=${orderDetail.value.price}`
		})
	}
}
/**
 * @Description: 接收订单变更消息
 * @param {*} msg
 * @return {*}
 */
const handleReceiveMsg = (msg) =>{
	if(msg.code != null ){
		if(msg.code == 801){
			ShowToast("取消订单成功")
			uni.switchTab({
				url:'/pages/index/index'
			})
		}
		if(msg.code == 802){
			msg.orderStatus=ORDER_STATUS.orderFinish
			ShowToast("支付订单成功")
		}
	}
    if(msg){
		console.log("消息:");
		console.log(msg);
		if(msg.orderStatus==ORDER_STATUS.awaitPay){
			orderDetail.value = msg;
		}else{
			orderDetail.value.orderStatus = msg.orderStatus;
		}
		if (mapRef.value) {
		    mapRef.value.driverUpdatePosition(msg.currentLongitude, msg.currentLatitude);
        }
    }
}

</script>
<style lang="scss" scoped>
.wrapper {
    width: 100%;
    height: calc(100vh - 500rpx);
}

.operation {
  position: fixed;
  bottom: 0;
  box-sizing: border-box;
  width: 100%;
  height: 505rpx;
  background: $uni-bg-color;
  border-radius: $uni-border-radius-lg $uni-border-radius-lg 0 0;
  z-index: 9;
  padding: $uni-spacing-row-max;
  padding-bottom: 40rpx;
  box-shadow: 0 3rpx 5rpx 5rpx #ccc;
}

.desc{
    height: 60rpx;
    line-height: 60rpx;
    font-size: 36rpx;
    font-weight: bold;
}

.start{
	height: 50rpx;
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

.driveMile,.driveTime{
	height: 60rpx;
	line-height: 60rpx;
	font-size: 32rpx;
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

.driver-info {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 让内容垂直居中 */
  height: 200rpx;
  margin-top: $uni-spacing-big;
}

.driver-info .license-plate {
  height: 70rpx;
  line-height: 70rpx;
  font-size: 48rpx;
  font-weight: bold;
}

.driver-info .info-left {
  flex-grow: 1;
}

.driver-info .car{
	height: 60rpx;
	line-height: 60rpx;
}
.driver-info .driver {
  height: 40rpx;
  line-height: 40rpx;
  color: rgb(21 19 19 / 70%);
}

.driver-info .phone-number {
  height: 40rpx;
  line-height: 40rpx;
  color: rgb(21 19 19 / 70%);
}

.driver-info .info-right{
	margin-right: 20rpx;
}
.driver-info .avatar {
	display: block;
	width: 150rpx;
	height: 150rpx;
	border-radius: 50%; 
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

.route{
	margin-top: $uni-spacing-big;
}
.route-info{
	display: flex;
	justify-content: space-between;
	align-items: center;
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

.calling_driver {
	  display: flex;
	  height: 100%;
	  flex-direction: column;
	  justify-content: space-between;
	}
.dotting { 
	display: inline-block; 
	width: 20px; 
	min-height: 4px;
	padding-right: 4px;
	margin-left: 4px; 
	padding-left: 4px;
	border-left: 4px solid black; 
	border-right: 4px solid black;
	background-color: black;
	background-clip: content-box;
	box-sizing: border-box;
	-webkit-animation: dot 1.5s infinite step-start both;
	animation: dot 1.5s infinite step-start both;
}

@keyframes dot {
	25% { border-color: transparent; background-color: transparent; }
	50% { border-right-color: transparent; background-color: transparent; }
	75% { border-right-color: transparent; }
}
</style>