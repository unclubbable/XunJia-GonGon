<template>
	<view class="create-page">
		<view class="map-layer">
			<BMap ref="mapRef" :initial-view-mode="'2D'" :bottom-padding="mapBottomPad" locate-mode="order" />
			<BWebSocket @receiveMsg="handleReceiveMsg" />
		</view>
		<view class="panel" v-if="!callingDriver">
			<view class="sheet-handle" />
			<view class="panel-title">确认行程</view>
			<view class="panel--bar">
				<text>车型</text>
				<picker
					mode="selector"
					:range="vehicleOptions"
					range-key="className"
					:value="vehiclePickerIndex"
					@change="handleVehicleChange"
				>
					<view class="time-bar vehicle-picker">
						<text>{{ selectedVehicleName }}</text>
					</view>
				</picker>
			</view>
			<view class="panel--bar">
				<text>预计时间</text>
				<text>
					<text>约 </text>
					<text class="price">{{ priceResult.timeMinute || '--' }}</text>
					<text> 分钟</text>
				</text>
			</view>
			<view class="panel--bar">
				<text>预计距离</text>
				<text>
					<text class="price">{{ priceResult.distanceMile || '--' }}</text>
					<text> 千米</text>
				</text>
			</view>
			<view class="panel--bar">
				<text>预计价格</text>
				<text class="price price-lg">￥{{ priceResult.price || '--' }}</text>
			</view>
			<view class="panel--bar">
				<text>出发时间</text>
				<view class="time-bar">
					<picker mode="date" fields="day" :value="departDay" :start="start" :end="end" style="margin-right: 10px;">
						<view class="time">{{ departDay }}</view>
					</picker>
					<picker mode="time" :value="departTime" @change="handleTimeChange" start="00:00" end="23:59">
						<view>{{ departTime }}</view>
					</picker>
				</view>
			</view>
			<view class="operation">
				<button class="btn btn__cancel" @click="handleCancel">取消</button>
				<button class="btn" :disabled="!priceResult.price" @click="handleConfirm">确认呼叫</button>
			</view>
		</view>
		<view class="panel calling_driver" v-if="callingDriver">
			<view class="sheet-handle" />
			<view class="calling-text">
				<text>正在为您全力呼叫司机</text>
				<text class="dotting"></text>
			</view>
			<button class="btn btn__cancel calling-cancel" @click="handleCancelCalling">取消用车</button>
		</view>
	</view>
</template>
<script setup>
import BWebSocket from '../../../component/BWebSocket.vue';
import BMap from '../../../component/BMap.vue';
import { onLoad } from '@dcloudio/uni-app';
import { computed, getCurrentInstance, nextTick, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { HandleApiError, ShowToast, ShowLoading, HideLoading} from '../../../utils';
import { ApiGetPrice, ApiPostOrderAdd, ApiGetCurrentOrder, ApiPostOrderCancel, ApiGetCurrentOrderDetail } from '../../../api/order';
import { ApiGetDictCarClassAll } from '../../../api/dictCarClass';
import { _FormatDate } from '@gykeji/jsutil';


const $store = useStore(); 
const city = computed(()=> $store.state.city);
const userInfo = computed(()=> $store.state.userInfo);
const instance = getCurrentInstance();
const start = _FormatDate(new Date(), 'yyyy-mm-dd');
const end = _FormatDate(new Date().getTime() + 3 * 24 * 60 * 60 * 1000, 'yyyy-mm-dd');
const mapRef = ref(null);
/** 底部确认卡高度，供地图 setBounds 留白，避免路线被面板挡住 */
const mapBottomPad = ref(320);
const callingDriver = ref(false);
const startDate = new Date()
let $routerQuery = {};
let priceResult = ref({});		//估算结果
let departTime = ref();			//出发时间
let departDay = ref();			//出发日期
let orderId = null;				//订单id
let msgFlag = false;			
let timeId = null;
let pollTimer = null;

// 车型：默认轿车(1)
const selectedVehicleType = ref('1');
const vehicleOptions = ref([
	{ classCode: '1', className: '轿车' },
	{ classCode: '2', className: 'SUV' },
	{ classCode: '3', className: 'MPV' },
	{ classCode: '4', className: '面包车' },
	{ classCode: '9', className: '其他' }
]);
const vehiclePickerIndex = computed(() => {
	const idx = vehicleOptions.value.findIndex(i => String(i.classCode) === String(selectedVehicleType.value));
	return idx >= 0 ? idx : 0;
});
const selectedVehicleName = computed(() => {
	const item = vehicleOptions.value.find(i => String(i.classCode) === String(selectedVehicleType.value));
	return item ? item.className : '轿车';
});

onLoad((option) => {
    $routerQuery = option;
});

function measureMapBottomPad() {
	return new Promise((resolve) => {
		nextTick(() => {
			try {
				let settled = false
				const finish = (val) => {
					if (settled) return
					settled = true
					mapBottomPad.value = Math.ceil(Math.max(val, 280))
					if (mapRef.value && mapRef.value.setBottomPadding) {
						mapRef.value.setBottomPadding(mapBottomPad.value)
					}
					resolve(mapBottomPad.value)
				}
				const query = uni.createSelectorQuery().in(instance)
				query.select('.panel').boundingClientRect((rect) => {
					finish((rect && rect.height) ? rect.height : 320)
				}).exec()
				setTimeout(() => finish(320), 400)
			} catch (_) {
				resolve(mapBottomPad.value)
			}
		})
	})
}

onMounted(async ()=>{
    getUserProgressOrder();
	await loadVehicleTypes();
    departDay.value = _FormatDate(new Date(), 'yyyy-mm-dd');
    departTime.value = _FormatDate(new Date().getTime() + 5 * 60 * 1000, 'hh:ii');
	await measureMapBottomPad();
    getPrice();
})

const loadVehicleTypes = async () => {
	try {
		const { error, result } = await ApiGetDictCarClassAll();
		if (!error && Array.isArray(result) && result.length) {
			vehicleOptions.value = result;
			const hasDefault = result.some(i => String(i.classCode) === '1');
			selectedVehicleType.value = hasDefault ? '1' : String(result[0].classCode);
		}
	} catch (e) {
		console.error('加载车辆类型失败', e);
	}
}

const handleVehicleChange = (e) => {
	const idx = Number(e.detail.value);
	const item = vehicleOptions.value[idx];
	if (!item) return;
	selectedVehicleType.value = String(item.classCode);
	priceResult.value = {};
	getPrice();
}

/**
 * 接收子组件 BWebSocket 传的消息
 */
const handleReceiveMsg = (arg) => {
    if (arg.driverId) {
        gotoOrderDetail(arg.orderId || orderId);
    } else {
        ShowToast("未能找到司机");
		callingDriver.value = false;
		stopPollOrder();
    }
	msgFlag = true;
	clearTimeout(timeId);
}

const gotoOrderDetail = (id) => {
	if (!id) return;
	orderId = id;
	stopPollOrder();
	uni.redirectTo({ url: `/pages/order/detail/index?orderId=${id}` });
}

const stopPollOrder = () => {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

/** WebSocket 未送达时，轮询订单是否已派单成功 */
const startPollOrder = () => {
	stopPollOrder();
	pollTimer = setInterval(async () => {
		if (!callingDriver.value || !orderId) return;
		const { error, result } = await ApiGetCurrentOrderDetail({ orderId });
		if (!HandleApiError(error) && result) {
			if (result.driverId) {
				gotoOrderDetail(result.id || orderId);
			} else if (result.orderStatus === 0) {
				ShowToast('未能找到司机');
				callingDriver.value = false;
				stopPollOrder();
				msgFlag = true;
				clearTimeout(timeId);
			}
		}
	}, 3000);
}

/**
 * 预估价格，路线规划
 */

const getPrice = async ()=>{
    const {slng:depLongitude, slat:depLatitude, elng:destLongitude, elat:destLatitude,s:dep,e:dest} = $routerQuery;
    const depLng = parseFloat(depLongitude);
    const depLat = parseFloat(depLatitude);
    const destLng = parseFloat(destLongitude);
    const destLat = parseFloat(destLatitude);
    const {error, result} = await ApiGetPrice({
        depLongitude: depLng,
        depLatitude: depLat,
        destLongitude: destLng,
        destLatitude: destLat,
        vehicleType: selectedVehicleType.value || '1',
        cityCode: city.value.adcode
    });
    if(!HandleApiError(error) && !result.hasOwnProperty("code")){
        priceResult.value = result;
        await nextTick();
        await measureMapBottomPad();
        mapDriving([depLng, depLat], [destLng, destLat]);
    }else{
		ShowToast(result.message || '当前车型暂无计价规则');
		priceResult.value = {};
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
                vehicleType: selectedVehicleType.value || priceResult.value.vehicleType
            });
    
            if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
                // 成功
                callingDriver.value = true;
                orderId = result.id;
				startPollOrder();
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
    uni.switchTab({url:'/pages/home/index'})
}

const handleCancelCalling = async () => {
	stopPollOrder();
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
        uni.redirectTo({url:`/pages/order/detail/index?orderId=${orderId}`})
    }
}
</script>
<style scoped lang="scss">
.create-page {
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
.panel {
	position: fixed;
	bottom: 0;
	left: 0;
	box-sizing: border-box;
	width: 100%;
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
.panel-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1f2f3d;
	margin-bottom: 8rpx;
	padding: 0 4rpx;
}
.panel--bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 76rpx;
	text {
		font-size: $uni-font-size-lg;
		color: $uni-text-color;
	}
}
.price {
	font-size: 30rpx;
	color: $uni-color-red;
	font-weight: bold;
}
.price-lg {
	font-size: 36rpx;
}
.time-bar {
	display: flex;
	align-items: center;
	&::after {
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
.vehicle-picker {
	min-width: 160rpx;
	justify-content: flex-end;
}
.operation {
	display: flex;
	align-items: center;
	padding-top: $uni-spacing-lg;
	justify-content: space-between;
	gap: 20rpx;
}
.btn {
	font-size: $uni-font-size-lg;
	margin: 0;
	background: $uni-color-primary;
	color: $uni-text-color-inverse;
	width: 45%;
	height: 84rpx;
	line-height: 84rpx;
	border-radius: 16rpx;
	&__cancel {
		background: #f3f6fa;
		color: $uni-text-color;
		border: 1px solid #e8ecf0;
	}
	&::after {
		display: none;
	}
}
.calling_driver {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-bottom: 48rpx;
}
.calling-text {
	font-size: 34rpx;
	font-weight: 600;
	color: #1f2f3d;
	margin: 24rpx 0 40rpx;
}
.calling-cancel {
	width: 70%;
}
.dotting {
	display: inline-block;
	width: 20px;
	min-height: 4px;
	padding-right: 4px;
	margin-left: 4px;
	padding-left: 4px;
	border-left: 4px solid $uni-color-primary;
	border-right: 4px solid $uni-color-primary;
	background-color: $uni-color-primary;
	background-clip: content-box;
	box-sizing: border-box;
	animation: dot 1.5s infinite step-start both;
}

@keyframes dot {
	25% {
		border-color: transparent;
		background-color: transparent;
	}
	50% {
		border-right-color: transparent;
		background-color: transparent;
	}
	75% {
		border-right-color: transparent;
	}
}
</style>