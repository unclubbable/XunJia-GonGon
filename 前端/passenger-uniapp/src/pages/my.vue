<template>
	<view class="personal-center">
		<!-- 顶部用户卡片 -->
		<view class="user-card">
			<view class="user-info">
				<image class="avatar" :src="userInfo.profilePhoto|| '/static/default-avatar.png'" mode="aspectFill"></image>
				<view class="info-text">
					<text class="phone">{{ userInfo.passengerPhone }}</text>
					<text class="role">乘客</text>
				</view>
			</view>
			<!-- 可选状态标识 -->
			<view class="status-badge">
				<uni-icons type="checkmarkempty" size="14" color="#52c41a" />
				<text>已认证</text>
			</view>
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
	import { computed } from 'vue';
	import gdMapConf from '../config/gdMapConf';

	const $store = useStore();
	// 直接从 store 中获取用户信息（响应式）
	const userInfo = computed(() => $store.state.userInfo);

	// 菜单配置：名称、页面路径、左侧图标（uni-icons 内置）
	const menuItems = [
		{ name: '个人信息管理', page: '/pages/myInfo'},
		{ name: '支付设置', page: '/pages/paymentSettings' },
		{ name: '客服', page: '/pages/customerService' },
		{ name: '向开发者提意见', page: '/pages/opinion' },
		{ name: '服务协议与平台规则', page: '/pages/termsAndRules' },
		{ name: '服务端地址(仅供测试)', page: '/pages/account'}
	];

	// 退出登录
	const handleLogout = () => {
		$store.commit("setToken", '');
		$store.commit("setCity", gdMapConf.city);
		uni.redirectTo({ url: '/pages/login' });
	};

	// 页面跳转
	const goToPage = (page) => {
		uni.navigateTo({ url: page });
	};
</script>

<style lang="scss" scoped>
	// 页面整体背景
	.personal-center {
		min-height: 100vh;
		background: linear-gradient(145deg, #f5f7fc 0%, #eef2f6 100%);
		padding: 30rpx 32rpx 60rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	// 顶部用户卡片
	.user-card {
		background: #ffffff;
		border-radius: 32rpx;
		padding: 32rpx 36rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
		margin-bottom: 24rpx;
		transition: all 0.3s ease;

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
					letter-spacing: 0.5rpx;
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

	// 菜单列表区域
	.menu-section {
		background: #ffffff;
		border-radius: 32rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
		margin-bottom: 48rpx;

		// 重写 uni-list 默认样式，使其更适配卡片风格
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
		// 最后一项移除下划线
		:deep(.uni-list-item:last-child) {
			.uni-list-item__border {
				display: none;
			}
		}
	}

	// 退出按钮区域
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