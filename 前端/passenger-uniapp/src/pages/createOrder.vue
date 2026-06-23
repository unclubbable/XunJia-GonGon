<template>
    <view class="map-wrapper">
        <BMap ref="mapRef"/>
        <BSseMessage @receiveMsg="handleReceiveMsg"/>
	</view>
	<view class="panel" v-if="!callingDriver">
		<view class="panel--bar">
			<text>时间：</text>
			<text>
				<text>大约需要 </text>
				<text class="price">{{priceResult.timeMinute}}</text>
				<text> 分钟</text>
			</text>
		</view>
		<view class="panel--bar">
			<text>距离：</text>
			<text>
				<text class="price">{{priceResult.distanceMile}}</text>
				<text> 千米</text>
			</text>
		</view>
		<view class="panel--bar">
			<text>预计价格：</text>
			<text class="price" style="font-size: 35rpx;">￥{{priceResult.price}}</text>
		</view>
		<view class="panel--bar">
			<text>出发时间：</text>
			<view class="time-bar">
				<picker mode="date" fields="day" :value="departDay" :start="start" :end="end" style="margin-right: 10px;">
					<view class="time">{{departDay}}</view>
				</picker>
				<picker mode="time" :value="departTime" @change="handleTimeChange" start="00:00" end="23:59">
					<view> {{departTime}}</view>
				</picker>
			</view>
		</view>
		<view class="operation">
			<button class="btn btn__cancel" @click="handleCancel">取消</button>
			<button class="btn" :disabled="!priceResult.price" @click="handleConfirm">确认呼叫</button>
		</view>
	</view>
	<view class="panel calling_driver" v-if="callingDriver">
		<view style="font-size: 18px;">
			<text>正在为您全力呼叫司机</text>
			<text class="dotting"></text>
		</view>
		<button class="btn btn__cancel" @click="handleCancelCalling" style="width: 65%;">取消用车</button>
	</view>
</template>
<script setup>
import BSseMessage from '../component/BSseMessage.vue';
import BMap from '../component/BMap.vue';
import { onLoad } from '@dcloudio/uni-app';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { HandleApiError, ShowToast, ShowLoading, HideLoading} from '../utils';
import { ApiGetPrice, ApiPostOrderAdd, ApiGetCurrentOrder, ApiPostOrderCancel } from '../api/order';
import { _FormatDate } from '@gykeji/jsutil';


const $store = useStore(); 
const city = computed(()=> $store.state.city);
const userInfo = computed(()=> $store.state.userInfo);
const start = _FormatDate(new Date(), 'yyyy-mm-dd');
const end = _FormatDate(new Date().getTime() + 3 * 24 * 60 * 60 * 1000, 'yyyy-mm-dd');
const mapRef = ref(null);
const callingDriver = ref(false);
const startDate = new Date()
let $routerQuery = {};
let priceResult = ref({});		//估算结果
let departTime = ref();			//出发时间
let departDay = ref();			//出发日期
let orderId = null;				//订单id
let msgFlag = false;			
let timeId = null;

onLoad((option) => {
    $routerQuery = option;
});
onMounted(()=>{
    getUserProgressOrder();
    getPrice();
    departDay.value = _FormatDate(new Date(), 'yyyy-mm-dd');
    departTime.value = _FormatDate(new Date().getTime() + 5 * 60 * 1000, 'hh:ii');
})

/**
 * 接收子组件BSseMessage.vue传的消息
 */
const handleReceiveMsg = (arg) => {
    // 根据接收到的 arg 执行相应的逻辑
    if (arg.driverId) {
		if(orderId==null){
			orderId = arg.orderId;
		}
        uni.redirectTo({url:`/pages/orderDetail?orderId=${orderId}`});
    } else {
        // 如果没有 driverId，执行其他逻辑
        ShowToast("未能找到司机");
		callingDriver.value = false;
    }
	// 设置标志位为 true，表示已经收到消息
	clearTimeout(timeId); // 取消定时器，因为已经收到消息
	msgFlag = true;
}

/**
 * 预估价格，路线规划
 */

const getPrice = async ()=>{
    const {slng:depLongitude, slat:depLatitude, elng:destLongitude, elat:destLatitude,s:dep,e:dest} = $routerQuery;
    const {error, result} = await ApiGetPrice({
        depLongitude,
        depLatitude,
        destLongitude,
        destLatitude,
        vehicleType: 1,
        cityCode: city.value.adcode
    });
    if(!HandleApiError(error) && !result.hasOwnProperty("code")){
        priceResult.value = result;
        nextTick(()=>{
            mapDriving([depLongitude,depLatitude],[destLongitude, destLatitude]);
        })
    }else{
		ShowToast(result.message);
		handleCancel();
	}
}
const handleTimeChange = (e) =>{
    departTime.value = e.detail.value;
}

const handleConfirm = async () =>{
	timeId = setTimeout(() =>{
				if(!msgFlag){
					ShowToast("未能找到司机");
					handleCancelCalling();
				}
			},1000*3*60)  //3分钟内未收到消息，取消订单(可能是后台异常，消费者挂了或者订单堆积)
	
	const { slng: depLongitude, slat: depLatitude, elng: destLongitude, elat: destLatitude, s: dep, e: dest } = $routerQuery;
	// 显示加载中
	ShowLoading("订单发送中");
    try {
            const { error, result } = await ApiPostOrderAdd({
                address: city.value.adcode,
                departTime: `${departDay.value} ${departTime.value}:01`,
                orderTime: _FormatDate(new Date(), 'yyyy-mm-dd hh:ii:ss'),
                departure: dep,
                depLongitude,
                depLatitude,
                destination: dest,
                destLongitude,
                destLatitude,
                encrypt: 14,
                fareType: priceResult.value.fareType,
                fareVersion: priceResult.value.fareVersion,
                passengerId: userInfo.value.id,
                passengerPhone: userInfo.value.passengerPhone,
                vehicleType: priceResult.value.vehicleType
            });
    
            if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
                // 成功
                callingDriver.value = true;
                orderId = result.id;
            } else {
                // 失败
                ShowToast(result.message);
            }
        } catch (error) {
            // 异常处理
            console.error("An error occurred during API call:", error);
        } finally {
            // 隐藏加载中
            HideLoading();
		}
}

const handleCancel = ()=>{
    uni.switchTab({url:'/pages/index/index'})
}

const handleCancelCalling = async () => {
    const {error, result} = await ApiPostOrderCancel({orderId: orderId});
    if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
        callingDriver.value = false;
    }else{
		ShowToast(result.message);
	}
}

/**
 * 绘制驾车路线
 */
const mapDriving = (dep,dest)=>{
    if(!mapRef.value ||!mapRef.value.driving){
        setTimeout(()=>{
            mapDriving(dep,dest)
        }, 500)
        return false;
    }
    mapRef.value.driving(dep,dest);
}



/**
 * 判断用户是否有正在进行的订单
 */
const getUserProgressOrder = async () => {
    const { error, result } = await ApiGetCurrentOrder();
    if (!HandleApiError(error) && result != null && !result.hasOwnProperty("code")) {
		orderId = result.id;
        uni.redirectTo({url:`/pages/orderDetail?orderId=${orderId}`})
    }
}
</script>
<style scoped lang="scss">
	.map-wrapper {
		width: 100%;
		height: calc(100vh - 480rpx);
	}
    .panel{
        position: fixed;
        bottom: 0;
		box-sizing: border-box;
        width: 100%;
		height: 490rpx;
        background: $uni-bg-color;
        border-radius: $uni-border-radius-lg $uni-border-radius-lg 0 0;
        z-index: 9;
        padding: $uni-spacing-row-max;
		padding-bottom: 40rpx;
        box-shadow: 0 3rpx 5rpx 5rpx #ccc;
        // background: linear-gradient(to bottom, rgb(255 140 0 / 60%), #ffffff);
        &--bar{
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 80rpx;
            text{
                font-size: $uni-font-size-lg;
                color: $uni-text-color;
            }
        }
        .price{
            font-size: 30rpx;
            color: $uni-color-red;
            font-weight: bold;
        }
        .time-bar{
            display: flex;
            align-items: center;
            &::after{
                display: block;
                content: '';
                height: 15rpx;
                width: 15rpx;
                border: 1px solid $uni-border-color;
                transform: rotate(45deg);
                border-left: 0;
                border-bottom: 0;
                margin-left: $uni-spacing-base;
            }
        }
    }
    .operation{
        display: flex;
        align-items: center;
        padding-top: $uni-spacing-lg;
        justify-content: space-between;
    }
    .btn{
		font-size: $uni-font-size-lg;
        margin: 0;
        background: $uni-color-primary;
        color: $uni-text-color-inverse;
        width: 45%;
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
	.calling_driver {
	  display: flex;
	  flex-direction: column;
	  justify-content: space-around;
	  align-items: center;
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