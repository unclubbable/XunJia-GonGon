<template>
	<view class="feedback-page">
		<!-- 顶部装饰 -->
		<view class="top-decoration"></view>
		
		<view class="content">
			<!-- 项目标题 -->
			<view class="project-title">
				<text class="title">迅家出行</text>
				<text class="subtitle">Express Home Taxi</text>
			</view>
			
			<!-- 简介卡片 -->
			<uni-card :is-full="true" :border="false" class="intro-card">
				<view class="intro-content">
					<text class="intro-text">出租车出行软件，涵盖乘客端与司机端，实现实时叫车、订单管理、地图导航、支付结算等核心功能。</text>
					<text class="intro-text">首次独立主导全栈开发，诚邀您体验并提出宝贵建议，您的反馈将帮助我成长！</text>
				</view>
			</uni-card>
			
			<!-- 开发者信息卡片 -->
			<uni-card :is-full="true" :border="false" class="info-card">
				<view class="card-header">
					<uni-icons type="person" size="24" color="#3c7e8c" />
					<text class="card-title">开发者信息</text>
				</view>
				<view class="info-list">
					<view class="info-item">
						<uni-icons type="email" size="18" color="#86909c" />
						<text class="info-label">邮箱：</text>
						<text class="info-value">2473579923@qq.com</text>
					</view>
					<view class="info-item">
						<uni-icons type="phone" size="18" color="#86909c" />
						<text class="info-label">手机：</text>
						<text class="info-value">15069840419</text>
					</view>
					<view class="info-item">
						<uni-icons type="weixin" size="18" color="#86909c" />
						<text class="info-label">微信：</text>
						<text class="info-value">wxid_9edrz2yesi2f22</text>
					</view>
				</view>
			</uni-card>
			
			<!-- 期待反馈卡片 -->
			<uni-card :is-full="true" :border="false" class="expect-card">
				<view class="card-header">
					<uni-icons type="chatbubbles" size="24" color="#3c7e8c" />
					<text class="card-title">期待您的反馈</text>
				</view>
				<view class="expect-content">
					<text>无论是功能建议、界面优化还是代码层面的指导，都对我意义重大。</text>
					<text>您可通过以上任一方式与我联系，感谢您的宝贵时间！</text>
				</view>
			</uni-card>
			
			<!-- 底部署名 -->
			<view class="footer">
				<text>© 2025 迅家出行</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	
</script>

<style lang="scss" scoped>
	.feedback-page {
		min-height: 100vh;
		background: linear-gradient(145deg, #f5f7fc 0%, #eef2f6 100%);
		position: relative;
	}
	
	.top-decoration {
		height: 120rpx;
		background: linear-gradient(135deg, #5c9ebd 0%, #3c7e8c 100%);
		border-radius: 0 0 60rpx 60rpx;
	}
	
	.content {
		padding: 0 32rpx 60rpx;
		margin-top: -40rpx;
	}
	
	.project-title {
		text-align: center;
		margin-bottom: 32rpx;
		
		.title {
			font-size: 56rpx;
			font-weight: 700;
			color: #1f2f3d;
			display: block;
			letter-spacing: 2rpx;
		}
		
		.subtitle {
			font-size: 28rpx;
			color: #86909c;
			letter-spacing: 1rpx;
		}
	}
	
	.intro-card {
		margin-bottom: 32rpx !important;
		border-radius: 32rpx;
		background: #ffffff;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
		
		:deep(.uni-card__content) {
			padding: 32rpx;
		}
		
		.intro-text {
			font-size: 28rpx;
			color: #4a5a6e;
			line-height: 1.6;
			display: block;
			margin-bottom: 16rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
		}
	}
	
	.info-card, .expect-card {
		margin-bottom: 32rpx !important;
		border-radius: 32rpx;
		background: #ffffff;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
		
		:deep(.uni-card__content) {
			padding: 0;
		}
		
		.card-header {
			display: flex;
			align-items: center;
			gap: 12rpx;
			padding: 32rpx 32rpx 0;
			margin-bottom: 24rpx;
			
			.card-title {
				font-size: 34rpx;
				font-weight: 600;
				color: #2c3e50;
			}
		}
		
		.info-list {
			padding: 0 32rpx 32rpx;
			
			.info-item {
				display: flex;
				align-items: center;
				gap: 12rpx;
				margin-bottom: 24rpx;
				
				.info-label {
					font-size: 28rpx;
					color: #86909c;
					width: 100rpx;
				}
				
				.info-value {
					font-size: 28rpx;
					color: #2c3e50;
					font-weight: 500;
					flex: 1;
				}
			}
		}
		
		.expect-content {
			padding: 0 32rpx 32rpx;
			
			text {
				font-size: 28rpx;
				color: #4a5a6e;
				line-height: 1.6;
				display: block;
				margin-bottom: 16rpx;
				
				&:last-child {
					margin-bottom: 0;
				}
			}
		}
	}
	
	.footer {
		text-align: center;
		margin-top: 40rpx;
		padding: 24rpx 0;
		
		text {
			font-size: 24rpx;
			color: #adb5bd;
		}
	}
</style>