<template>
	<view class="personal-center">
		<!-- 顶部个人信息卡片 -->
		<view class="user-card">
			<view class="user-info">
				<image class="avatar" src="/static/default-avatar.png" mode="aspectFill"></image>
				<view class="info-text">
					<text class="phone">{{ userInfo.driverPhone || '未登录' }}</text>
					<text class="role">认证司机</text>
				</view>
			</view>
			<view class="status-badge">
				<uni-icons type="checkmarkempty" size="14" color="#52c41a" />
				<text>已认证</text>
			</view>
		</view>

		<!-- 订单消息组件 -->
		<view class="message-wrapper">
			<BSseMessage @receiveOrder="handleReceiveOrder" />
		</view>

		<!-- 重要提示卡片 -->
		<view class="info-tip">
			<uni-icons type="info" size="20" color="#3c7e8c" class="tip-icon" />
			<text class="tip-text">司机端如需修改个人信息或更换绑定车辆，请主动联系当地站点工作人员进行后台处理。</text>
		</view>

		<!-- 功能菜单列表 -->
		<view class="menu-section">
			<uni-list :border="false">
				<uni-list-item 
					v-for="(item, index) in menuItems" 
					:key="index"
					:title="item.name"
					show-arrow
					clickable
					@click="goToPage(item.page)"
				/>
			</uni-list>
		</view>

		<!-- 退出登录按钮 -->
		<view class="logout-wrapper">
			<button class="logout-btn" @click="handleLogout">退出登录</button>
		</view>
	</view>
</template>

<script setup>
	import { useStore } from "vuex";
	import { onMounted, ref } from 'vue';
	import { ShowToast } from "../utils";
	import gdMapConf from '../config/gdMapConf';
	import { ApiGetUserInfo } from '../api/user';
	import BSseMessage from '../component/BSseMessage.vue';

	const userInfo = ref({
		driverPhone: ''
	});
	const $store = useStore();

	// 菜单配置
	const menuItems = ref([
		{ name: '个人信息管理', page: '/pages/myInfo'},
		{ name: '设置运营城市', page: '/pages/setOperatingCity' },
		{ name: '绑定车辆', page: '/pages/paymentSettings' },
		{ name: '向开发者提意见', page: '/pages/opinion' },
		{ name: '服务协议与平台规则', page: '/pages/termsAndRules' }
	]);

	onMounted(() => {
		const driverId = $store.state.userInfo?.driverId;
		if (driverId) {
			getUserInfo(driverId);
		}
	});

	const getUserInfo = async (driverId) => {
		try {
			const { error, result } = await ApiGetUserInfo(driverId);
			if (result) {
				userInfo.value = result;
			}
		} catch (e) {
			console.error('获取用户信息失败', e);
		}
	};

	const handleReceiveOrder = (arg) => {
		if (arg && arg.orderId) {
			uni.redirectTo({ url: `/pages/orderDetail?orderId=${arg.orderId}` });
		}
	};

	const handleLogout = () => {
		$store.commit("setToken", '');
		$store.commit("setCity", gdMapConf.city);
		// 关闭所有页面，打开到登录页
		uni.reLaunch({
		  url: '/pages/login' // 必须写你项目里真实的登录页路径
		})
	};

	const goToPage = (page) => {
		getApp().globalData.userInfo = userInfo.value;
		uni.navigateTo({ url: page });
	};
</script>

<style lang="scss" scoped>
	.personal-center {
		min-height: 100vh;
		background: linear-gradient(145deg, #f5f7fc 0%, #eef2f6 100%);
		padding: 30rpx 32rpx 60rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.user-card {
		background: #ffffff;
		border-radius: 32rpx;
		padding: 32rpx 36rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
		margin-bottom: 24rpx;

		.user-info {
			display: flex;
			align-items: center;
			gap: 24rpx;
			flex: 1;

			.avatar {
				width: 112rpx;
				height: 112rpx;
				border-radius: 50%;
				background: #e9ecef;
				border: 4rpx solid #ffffff;
				box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.08);
			}

			.info-text {
				display: flex;
				flex-direction: column;
				gap: 12rpx;

				.phone {
					font-size: 36rpx;
					font-weight: 600;
					color: #1f2f3d;
				}

				.role {
					font-size: 26rpx;
					color: #86909c;
					background: #f2f3f5;
					padding: 4rpx 16rpx;
					border-radius: 40rpx;
					align-self: flex-start;
				}
			}
		}

		.status-badge {
			background: #f6ffed;
			padding: 8rpx 20rpx;
			border-radius: 60rpx;
			display: flex;
			align-items: center;
			gap: 6rpx;
			font-size: 24rpx;
			color: #52c41a;
			font-weight: 500;
		}
	}

	.message-wrapper {
		margin-bottom: 24rpx;
		border-radius: 32rpx;
		overflow: hidden;
		background: transparent;
	}

	/* 新增提示卡片样式 */
	.info-tip {
		background: #eef6ff;
		border-radius: 24rpx;
		padding: 28rpx 32rpx;
		margin-bottom: 24rpx;
		display: flex;
		align-items: flex-start;
		gap: 20rpx;
		backdrop-filter: blur(2px);
		box-shadow: 0 2rpx 12rpx rgba(60, 126, 140, 0.08);

		.tip-icon {
			flex-shrink: 0;
			margin-top: 4rpx;
		}

		.tip-text {
			flex: 1;
			font-size: 28rpx;
			color: #2c6e8c;
			line-height: 1.5;
		}
	}

	.menu-section {
		background: #ffffff;
		border-radius: 32rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
		margin-bottom: 48rpx;

		:deep(.uni-list) {
			background-color: transparent;
			&::before,
			&::after {
				display: none;
			}
		}
		:deep(.uni-list-item) {
			padding: 20rpx 32rpx;
			transition: background 0.2s ease;
			&:active {
				background: #f8f9fc;
			}
			.uni-list-item__container {
				padding: 0;
			}
			.uni-list-item__content-title {
				font-size: 32rpx;
				font-weight: 500;
				color: #2c3e50;
			}
			.uni-icons {
				color: #3c7e8c;
			}
		}
		:deep(.uni-list-item:last-child) {
			.uni-list-item__border {
				display: none;
			}
		}
	}

	.logout-wrapper {
		margin-top: auto;
		padding-top: 20rpx;

		.logout-btn {
			background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
			color: white;
			font-size: 32rpx;
			font-weight: 600;
			border-radius: 60rpx;
			height: 96rpx;
			line-height: 96rpx;
			border: none;
			box-shadow: 0 8rpx 20rpx rgba(238, 90, 90, 0.25);
			transition: all 0.2s ease;

			&::after {
				border: none;
			}

			&:active {
				transform: scale(0.97);
				opacity: 0.9;
			}
		}
	}
</style>