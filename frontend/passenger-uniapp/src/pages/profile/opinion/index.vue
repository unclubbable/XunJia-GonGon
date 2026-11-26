<template>
	<view class="feedback-page">
		<view class="top-decoration"></view>

		<view class="content">
			<view class="project-title">
				<text class="title">迅家出行</text>
				<text class="subtitle">Express Home Taxi</text>
			</view>

			<uni-card :is-full="true" :border="false" class="intro-card">
				<view class="intro-content">
					<text class="intro-text">出租车出行软件，涵盖乘客端与司机端，实现实时叫车、订单管理、地图导航、支付结算等核心功能。</text>
					<text class="intro-text">首次独立主导全栈开发，诚邀您体验并提出宝贵建议，您的反馈将帮助我成长！</text>
				</view>
			</uni-card>

			<uni-card :is-full="true" :border="false" class="info-card">
				<view class="card-header">
					<view class="icon-wrap">
						<uni-icons type="person" size="20" color="#318eff" />
					</view>
					<text class="card-title">开发者信息</text>
				</view>
				<view class="info-list">
					<view class="info-item">
						<uni-icons type="email" size="18" color="#318eff" />
						<text class="info-label">邮箱</text>
						<text class="info-value">2473579923@qq.com</text>
					</view>
					<view class="info-item">
						<uni-icons type="phone" size="18" color="#318eff" />
						<text class="info-label">手机</text>
						<text class="info-value">15069840419</text>
					</view>
					<view class="info-item">
						<uni-icons type="weixin" size="18" color="#318eff" />
						<text class="info-label">微信</text>
						<text class="info-value">wxid_9edrz2yesi2f22</text>
					</view>
				</view>
			</uni-card>

			<uni-card :is-full="true" :border="false" class="expect-card">
				<view class="card-header">
					<view class="icon-wrap">
						<uni-icons type="chatbubbles" size="20" color="#318eff" />
					</view>
					<text class="card-title">期待您的反馈</text>
				</view>
				<view class="expect-content">
					<text>无论是功能建议、界面优化还是代码层面的指导，都对我意义重大。</text>
					<text>您可通过以上任一方式与我联系，感谢您的宝贵时间！</text>
				</view>
			</uni-card>

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
		background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
		position: relative;
	}

	.top-decoration {
		height: 160rpx;
		background: linear-gradient(135deg, #0b6bcb 0%, #318eff 50%, #69c0ff 100%);
		border-radius: 0 0 48rpx 48rpx;
	}

	.content {
		padding: 0 32rpx 60rpx;
		margin-top: -56rpx;
	}

	.project-title {
		text-align: center;
		margin-bottom: 28rpx;

		.title {
			font-size: 52rpx;
			font-weight: 700;
			color: #fff;
			display: block;
			letter-spacing: 2rpx;
			text-shadow: 0 4rpx 12rpx rgba(0, 40, 100, 0.25);
		}

		.subtitle {
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.85);
			letter-spacing: 1rpx;
			margin-top: 8rpx;
			display: block;
		}
	}

	.intro-card {
		margin-bottom: 24rpx !important;
		border-radius: 28rpx;
		background: #ffffff;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);

		:deep(.uni-card__content) {
			padding: 32rpx;
		}

		.intro-text {
			font-size: 28rpx;
			color: #4a5a6e;
			line-height: 1.65;
			display: block;
			margin-bottom: 16rpx;

			&:last-child {
				margin-bottom: 0;
			}
		}
	}

	.info-card,
	.expect-card {
		margin-bottom: 24rpx !important;
		border-radius: 28rpx;
		background: #ffffff;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);

		:deep(.uni-card__content) {
			padding: 0;
		}

		.card-header {
			display: flex;
			align-items: center;
			gap: 16rpx;
			padding: 32rpx 32rpx 0;
			margin-bottom: 24rpx;

			.icon-wrap {
				width: 56rpx;
				height: 56rpx;
				border-radius: 16rpx;
				background: #e8f3ff;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.card-title {
				font-size: 32rpx;
				font-weight: 600;
				color: #1f2f3d;
			}
		}

		.info-list {
			padding: 0 32rpx 32rpx;

			.info-item {
				display: flex;
				align-items: center;
				gap: 12rpx;
				margin-bottom: 20rpx;
				padding: 20rpx 24rpx;
				background: #f8f9fc;
				border-radius: 16rpx;

				&:last-child {
					margin-bottom: 0;
				}

				.info-label {
					font-size: 26rpx;
					color: #86909c;
					width: 72rpx;
					flex-shrink: 0;
				}

				.info-value {
					font-size: 28rpx;
					color: #1f2f3d;
					font-weight: 500;
					flex: 1;
					word-break: break-all;
				}
			}
		}

		.expect-content {
			padding: 0 32rpx 32rpx;

			text {
				font-size: 28rpx;
				color: #4a5a6e;
				line-height: 1.65;
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
		margin-top: 32rpx;
		padding: 24rpx 0;

		text {
			font-size: 24rpx;
			color: #c5cdd8;
		}
	}
</style>
