<template>
	<view class="driver-home">
		<!-- 订单消息组件 -->
		<view class="message-wrapper">
			<BSseMessage @receiveOrder="handleReceiveOrder" />
		</view>

		<!-- 动态时间卡片（替换原统计卡片） -->
		<view class="time-card">
			<view class="clock-wrapper">
				<view class="time-digits">
					<text class="digit">{{ formattedTime.hour }}</text>
					<text class="colon">:</text>
					<text class="digit">{{ formattedTime.minute }}</text>
					<text class="colon">:</text>
					<text class="digit second">{{ formattedTime.second }}</text>
				</view>
				<view class="date-info">
					<text class="date">{{ formattedTime.date }}</text>
					<text class="weekday">{{ formattedTime.weekday }}</text>
				</view>
			</view>
			<view class="time-decoration">
				<view class="circle"></view>
				<view class="circle"></view>
				<view class="circle"></view>
			</view>
		</view>

		<!-- 功能入口网格（保持不变） -->
		<view class="grid-menu">
			<view class="grid-item" @click="goToPage('/pages/map')">
				<view class="icon-bg">
					<uni-icons type="location" size="32" color="#3c7e8c" />
				</view>
				<text>地图</text>
			</view>
			<view class="grid-item" @click="goToPage('/pages/monsy')">
				<view class="icon-bg">
					<uni-icons type="wallet" size="32" color="#3c7e8c" />
				</view>
				<text>钱包</text>
			</view>
			<view class="grid-item" @click="goToPage('/pages/orderInfo')">
				<view class="icon-bg">
					<uni-icons type="calendar" size="32" color="#3c7e8c" />
				</view>
				<text>订单</text>
			</view>
			<view class="grid-item" @click="goToPage('/pages/my')">
				<view class="icon-bg">
					<uni-icons type="person" size="32" color="#3c7e8c" />
				</view>
				<text>个人中心</text>
			</view>
		</view>

		<!-- 出车/收车操作区（保持不变） -->
		<view class="operation" v-show="iscar">
			<template v-if="workStatus === 1">
				<view class="desc">听单中...</view>
				<button class="btn btn__warning" @click="handleWorkStatus(0)">收车</button>
			</template>
			<template v-else>
				<view class="desc">勤劳的小蜜蜂，要开始工作了吗？</view>
				<button class="btn btn__primary" @click="handleWorkStatus(1)">出车</button>
			</template>
		</view>
	</view>
</template>

<script setup>
import UEmpty from '../component/UEmpty.vue';
import BSseMessage from '../component/BSseMessage.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useStore } from 'vuex';
import { ApiPostToPickUpPassenger, ApiGetCurrentOrder } from '../api/order';
import { HandleApiError } from '../utils';
import { _FormatDate } from '@gykeji/jsutil';
import { ShowToast } from '../utils';
import { ApiGetWorkStatus, ApiPostUpdateWorkStatus, ApiPostUpdatePoint, ApiGetUserCarInfo } from '../api/user';

const $store = useStore();
const userInfo = computed(() => $store.state.userInfo);
let workStatus = ref(null);
let orderId = null;
let iscar = ref(1); // 是否有车（默认有车）
onMounted(() => {
	getUserCarInfo();		//初始化逻辑功能
	startTimer();			//启动定时器
});
//取消先前通过调用setInterval()设置的重复定时任务
onUnmounted(() => {
	if (timer) {
		clearInterval(timer);
		console.log("时间计时器已清除");
	}
	if (pointTimer) {
		clearTimeout(pointTimer);
		pointTimer = null;
		console.log("定位定时器已清除");
	}
});

//websockt自动收订单
function handleReceiveOrder(arg) {
	console.log("收到订单：" + arg.orderId);
	orderId = arg.orderId;
	uni.redirectTo({ url: `/pages/orderDetail?orderId=${orderId}` });
}
//初始化方法
async function getUserCarInfo() {
	const { error, result } = await ApiGetUserCarInfo();
	if (result) {
		$store.commit('setUserInfo', result);
		getWorkStatus(); 			// 获取用户工作状态
		getUserProgressOrder(); 	// 获取当前订单信息,若有则跳转
		updatePoint(); 				// 定时5秒上报当前位置（已注释）
	} else {
		ShowToast('司机没有绑定的车，请联系管理员15069840419');
		iscar.value = 0;
	}
}
// 定位定时器 ID
let pointTimer = null;

/**
 * 请求定位权限（如果未授权则弹窗引导）
 * @returns {Promise<boolean>} 是否已获得权限
 */
async function requestLocationPermission() {
    return new Promise((resolve) => {
        uni.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userLocation']) {
                    // 已有权限
                    resolve(true);
                } else {
                    // 无权限，尝试申请
                    uni.authorize({
                        scope: 'scope.userLocation',
                        success: () => {
                            resolve(true);
                        },
                        fail: () => {
                            // 用户拒绝过
							
                        }
                    });
                }
            },
            fail: () => {
                resolve(false);
            }
        });
    });
}
/**
 * @Description: 定时5秒上报当前位置
 * @return {*}
 */
function updatePoint (){
	
	
	// 弹框：让用户开启权限
	requestLocationPermission()
	
	uni.getLocation({
		type: 'gcj02',
		geocode: true,
		success: async (result) =>{
			const {error} = await ApiPostUpdatePoint({
				carId: userInfo.value.carId,
				points: [{
					location: `${result.longitude},${result.latitude}`,
					locatetime: new Date().getTime()
				}]
			});
			if(!error){
				console.log(result);
				$store.commit('setPoint',{ 
					lng:result.longitude,
					lat:result.latitude,
					name:result.address.city,
					code:result.address.cityCode,
					accuracy: result.accuracy
				})
			}
			pointTimer=setTimeout(()=>{
				updatePoint()
			}, 5000)
		},
		fail(err) {
			
			// 失败
			uni.showToast({
			  title: '没有定位权限',
			  duration: 10000 // 提示持续2秒后自动关闭
			});
		}
	});
	        
}
//获取工作状态
async function getWorkStatus() {
	const { error, result } = await ApiGetWorkStatus({
		driverId: userInfo.value.driverId
	});
	workStatus.value = result.workStatus;
}
//是否有当前订单，有则跳转
async function getUserProgressOrder() {
	const { error, result } = await ApiGetCurrentOrder();
	if (!HandleApiError(error) && result != null && !result.hasOwnProperty("code")) {
		orderId = result.id;
		uni.redirectTo({ url: `/pages/orderDetail?orderId=${orderId}` });
	}
}
//出车状态修改
async function handleWorkStatus(status) {
	// 提交出车请求
	const { error, result } = await ApiPostUpdateWorkStatus({
		driverId: userInfo.value.driverId,
		workStatus: status,
		citycode: $store.state.point.code
	});
	console.log($store.state.point);
	console.log(error);
	console.log(result);
	console.log(status);
	if(result != null && result.code == 0 &&status == 1){
		uni.showToast({ title: '无法出车(请检查是否在运营城市内)', icon: 'none' });
	}
	else{
		if (!HandleApiError(error)   ) {
			workStatus.value = status;
		}
	}
}
//跳转工具方法
function goToPage(page) {
	uni.navigateTo({
		url: page
	});
}

// ========== 时间 ==========
const currentTime = ref(new Date());
let timer = null;

// 格式化时间显示
const formattedTime = computed(() => {
	const now = currentTime.value;
	const hour = now.getHours().toString().padStart(2, '0');
	const minute = now.getMinutes().toString().padStart(2, '0');
	const second = now.getSeconds().toString().padStart(2, '0');
	const year = now.getFullYear();
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');
	const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
	const weekday = weekdays[now.getDay()];
	return {
		hour,
		minute,
		second,
		date: `${year}.${month}.${day}`,
		weekday
	};
});

// 更新时间
const updateTime = () => {
	currentTime.value = new Date();
};

// 启动定时器
const startTimer = () => {
	timer = setInterval(updateTime, 1000);
};

</script>

<style lang="scss" scoped>
.driver-home {
	min-height: 100vh;
	background: linear-gradient(145deg, #f5f7fc 0%, #eef2f6 100%);
	padding: 30rpx 32rpx 160rpx;
	box-sizing: border-box;
	position: relative;
}

.message-wrapper {
	margin-bottom: 24rpx;
	border-radius: 32rpx;
	overflow: hidden;
	background: transparent;
}

/* 动态时间卡片*/
.time-card {
	background: linear-gradient(135deg, #2c3e50, #1a2a3a);
	border-radius: 48rpx;
	padding: 48rpx 32rpx;
	margin-bottom: 32rpx;
	position: relative;
	overflow: hidden;
	box-shadow: 0 16rpx 32rpx rgba(0, 0, 0, 0.2);
	
	.clock-wrapper {
		position: relative;
		z-index: 2;
		text-align: center;
		
		.time-digits {
			display: flex;
			justify-content: center;
			align-items: baseline;
			gap: 8rpx;
			margin-bottom: 24rpx;
			font-weight: 700;
			text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
			
			.digit {
				font-size: 80rpx;
				font-family: monospace;
				background: linear-gradient(135deg, #fff, #e0e4e8);
				-webkit-background-clip: text;
				background-clip: text;
				color: transparent;
				letter-spacing: 4rpx;
			}
			
			.colon {
				font-size: 80rpx;
				color: #ffa64d;
				text-shadow: 0 0 10rpx rgba(255, 166, 77, 0.5);
				margin: 0 4rpx;
			}
			
			.second {
				background: linear-gradient(135deg, #ffa64d, #ff7e05);
				-webkit-background-clip: text;
				background-clip: text;
			}
		}
		
		.date-info {
			display: flex;
			justify-content: center;
			gap: 24rpx;
			font-size: 28rpx;
			color: rgba(255, 255, 255, 0.9);
			
			.date {
				font-weight: 500;
				letter-spacing: 1rpx;
			}
			
			.weekday {
				background: rgba(255, 166, 77, 0.2);
				padding: 6rpx 20rpx;
				border-radius: 60rpx;
				font-weight: 500;
				color: #ffa64d;
			}
		}
	}
	
	.time-decoration {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
		
		.circle {
			position: absolute;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.05);
			
			&:nth-child(1) {
				width: 200rpx;
				height: 200rpx;
				top: -80rpx;
				right: -60rpx;
			}
			
			&:nth-child(2) {
				width: 120rpx;
				height: 120rpx;
				bottom: -40rpx;
				left: -30rpx;
			}
			
			&:nth-child(3) {
				width: 80rpx;
				height: 80rpx;
				bottom: 40rpx;
				right: 20rpx;
			}
		}
	}
}

/* 功能网格 */
.grid-menu {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	background: #ffffff;
	border-radius: 32rpx;
	padding: 32rpx 20rpx;
	margin-bottom: 48rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
	
	.grid-item {
		width: 25%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
		cursor: pointer;
		
		.icon-bg {
			width: 100rpx;
			height: 100rpx;
			background: #f0f7fc;
			border-radius: 48rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
		}
		
		text {
			font-size: 28rpx;
			color: #2c3e50;
			font-weight: 500;
		}
		
		&:active {
			.icon-bg {
				transform: scale(0.96);
				background: #e6f0f5;
			}
		}
	}
}

/* 出车/收车按钮 */
.operation {
	position: fixed;
	bottom: 50rpx;
	left: 0;
	right: 0;
	text-align: center;
	
	.desc {
		font-size: 28rpx;
		color: #86909c;
		margin-bottom: 20rpx;
	}
	
	.btn {
		width: 200rpx;
		height: 200rpx;
		line-height: 180rpx;
		border-radius: 50%;
		font-size: 46rpx;
		font-weight: 600;
		margin: 0 auto;
		border: none;
		box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.15);
		transition: all 0.2s;
		
		&::after {
			border: none;
		}
		
		&:active {
			transform: scale(0.96);
			opacity: 0.9;
		}
		
		&__primary {
			background: linear-gradient(135deg, #5c9ebd, #3c7e8c);
			color: #fff;
		}
		
		&__warning {
			background: linear-gradient(135deg, #ffa64d, #ff7e05);
			color: #fff;
		}
	}
}
</style>