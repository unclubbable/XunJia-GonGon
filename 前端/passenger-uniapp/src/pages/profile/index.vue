<template>
	<view class="personal-center">
		<!-- 顶部用户卡片 -->
		<view class="user-card">
			<view class="user-card__glow user-card__glow--tr"></view>
			<view class="user-card__glow user-card__glow--bl"></view>
			<view class="user-card__body">
				<view class="user-info">
					<image class="avatar" :src="userInfo.profilePhoto|| '/static/default-avatar.png'" mode="aspectFill"></image>
					<view class="info-text">
						<text class="phone">{{ userInfo.passengerPhone || '未登录' }}</text>
						<text class="role">乘客</text>
					</view>
				</view>
				<view class="status-badge">
					<uni-icons type="checkmarkempty" size="14" color="#fff" />
					<text>已认证</text>
				</view>
			</view>
		</view>

		<!-- 功能菜单列表 -->
		<view class="menu-section">
			<view class="section-title">常用功能</view>
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
	import gdMapConf from '../../config/gdMapConf';

	const $store = useStore();
	const userInfo = computed(() => $store.state.userInfo);

	const menuItems = [
		{ name: '我的工单', page: '/pages/ticket/list/index'},
		{ name: '个人信息管理', page: '/pages/profile/info/index'},
		{ name: '支付设置', page: '/pages/profile/payment/index' },
		{ name: '向开发者提意见', page: '/pages/profile/opinion/index' },
		{ name: '服务协议与平台规则', page: '/pages/profile/terms/index' },
		{ name: '服务端地址(仅供测试)', page: '/pages/dev/account'}
	];

	const handleLogout = () => {
		$store.commit("setToken", '');
		$store.commit("setCity", gdMapConf.city);
		uni.redirectTo({ url: '/pages/auth/login/index' });
	};

	const goToPage = (page) => {
		uni.navigateTo({ url: page });
	};
</script>

<style lang="scss" scoped>
	.personal-center {
		min-height: 100vh;
		background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
		padding: 24rpx 32rpx 60rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.user-card {
		position: relative;
		border-radius: 32rpx;
		overflow: hidden;
		margin-bottom: 24rpx;
		background-color: #318eff;
		background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230b6bcb'/%3E%3Cstop offset='45%25' stop-color='%23318eff'/%3E%3Cstop offset='100%25' stop-color='%2369c0ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='200' fill='url(%23g)'/%3E%3C/svg%3E");
		background-size: 100% 100%;
		background-repeat: no-repeat;
		box-shadow: 0 16rpx 40rpx rgba(49, 142, 255, 0.35);
	}

	.user-card__glow {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
	}

	.user-card__glow--tr {
		right: -60rpx;
		top: -80rpx;
		width: 240rpx;
		height: 240rpx;
		background: rgba(255, 255, 255, 0.18);
	}

	.user-card__glow--bl {
		left: -50rpx;
		bottom: -90rpx;
		width: 220rpx;
		height: 220rpx;
		background: rgba(255, 255, 255, 0.1);
	}

	.user-card__body {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 40rpx 32rpx;
		box-sizing: border-box;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 24rpx;
		flex: 1;
		min-width: 0;

		.avatar {
			width: 120rpx;
			height: 120rpx;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.25);
			border: 6rpx solid rgba(255, 255, 255, 0.95);
			box-shadow: 0 8rpx 24rpx rgba(0, 40, 100, 0.25);
			flex-shrink: 0;
		}

		.info-text {
			display: flex;
			flex-direction: column;
			gap: 14rpx;
			min-width: 0;

			.phone {
				font-size: 36rpx;
				font-weight: 700;
				color: #ffffff;
				letter-spacing: 1rpx;
				text-shadow: 0 2rpx 8rpx rgba(0, 40, 100, 0.2);
			}

			.role {
				font-size: 22rpx;
				color: #fff;
				background: rgba(255, 255, 255, 0.22);
				padding: 6rpx 18rpx;
				border-radius: 999rpx;
				align-self: flex-start;
				font-weight: 500;
				border: 1px solid rgba(255, 255, 255, 0.28);
			}
		}
	}

	.status-badge {
		background: rgba(255, 255, 255, 0.22);
		padding: 10rpx 22rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;
		font-size: 24rpx;
		color: #fff;
		font-weight: 500;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(8px);
	}

	.menu-section {
		background: #ffffff;
		border-radius: 28rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);
		margin-bottom: 48rpx;
	}

	.section-title {
		padding: 28rpx 32rpx 8rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #86909c;
	}

	.menu-section :deep(.uni-list) {
		background-color: transparent;
		&::before,
		&::after {
			display: none;
		}
	}

	.menu-section :deep(.uni-list-item) {
		padding: 24rpx 32rpx;
		transition: background 0.2s ease;

		&:active {
			background: #f8f9fc;
		}

		.uni-list-item__container {
			padding: 0;
		}

		.uni-list-item__content-title {
			font-size: 30rpx;
			font-weight: 500;
			color: #1f2f3d;
		}

		.uni-icons {
			color: #318eff;
		}
	}

	.menu-section :deep(.uni-list-item:last-child) {
		.uni-list-item__border {
			display: none;
		}
	}

	.logout-wrapper {
		margin-top: auto;
		padding-top: 20rpx;

		.logout-btn {
			background: #fff;
			color: #ff4d4f;
			font-size: 32rpx;
			font-weight: 600;
			border-radius: 999rpx;
			height: 96rpx;
			line-height: 96rpx;
			border: 1px solid rgba(255, 77, 79, 0.25);
			box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.08);

			&::after {
				border: none;
			}

			&:active {
				transform: scale(0.98);
				background: #fff2f0;
			}
		}
	}
</style>