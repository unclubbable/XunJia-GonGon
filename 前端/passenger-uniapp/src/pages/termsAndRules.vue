<template>
	<view class="agreement-page">
		<scroll-view scroll-y class="scroll-content">
			
			<!-- 引言卡片 -->
			<uni-card :is-full="true" :border="false" class="intro-card">
				<view class="intro-content">
					<text class="intro-title">欢迎使用迅家出行</text>
					<text class="intro-desc">迅家出行为您提供安全、便捷、舒适的出行服务。请您在使用本平台前仔细阅读并充分理解本协议的全部内容，特别是加粗或标红的条款。</text>
				</view>
			</uni-card>
			
			<!-- 协议主体内容 - 使用折叠面板 -->
			<uni-card :is-full="true" :border="false" class="agreement-card">
				<uni-collapse ref="collapse" accordion>
					<uni-collapse-item title="一、用户注册与账号管理" open>
						<view class="collapse-content">
							<text class="content-text">1.1 用户需使用本人手机号码进行注册，并确保所提供信息的真实、准确、完整。如信息发生变更，应及时更新。</text>
							<text class="content-text">1.2 用户账号仅限本人使用，不得转让、出租或借予他人。因账号保管不善导致的损失由用户自行承担。</text>
							<text class="content-text">1.3 用户应年满18周岁，具备完全民事行为能力。未满18周岁的用户需在监护人陪同下使用平台服务。</text>
							<text class="content-text">1.4 平台有权对存在异常行为的账号采取限制措施，包括但不限于暂停服务、要求身份核验等。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="二、乘车规范与安全须知">
						<view class="collapse-content">
							<text class="content-text">2.1 乘客应在下单时准确填写上车地点和目的地，并保持通讯畅通，方便司机联系。</text>
							<text class="content-text">2.2 乘车过程中，乘客应系好安全带，不得干扰驾驶员操作，不得要求超员、超速或违反交通法规。</text>
							<text class="content-text">2.3 禁止携带易燃、易爆、有毒等危险品上车，不得在车内吸烟、饮食或做出影响行车安全的行为。</text>
							<text class="content-text">2.4 乘客需按照平台显示金额支付车费，不得无故拒付或恶意逃单。如对费用有异议，可通过客服渠道解决。</text>
							<text class="content-text">2.5 乘客遗失物品时，可联系平台客服协助寻找，司机返还物品产生的合理费用由乘客承担。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="三、费用说明与支付规则">
						<view class="collapse-content">
							<text class="content-text">3.1 车费由起步价、里程费、时长费及可能的动态溢价构成，具体标准以订单页面展示为准。</text>
							<text class="content-text">3.2 乘客下单后，若司机已接单，乘客取消订单可能产生取消费，具体规则详见平台公示。</text>
							<text class="content-text">3.3 平台支持微信、支付宝等多种支付方式。支付成功后，订单自动完成，乘客可通过订单详情查看费用明细。</text>
							<text class="content-text">3.4 如遇支付失败或重复扣款，请及时联系平台客服处理，平台将在核实后7个工作日内处理。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="四、用户权益与投诉处理">
						<view class="collapse-content">
							<text class="content-text">4.1 乘客有权要求司机按照规划路线行驶，如司机存在绕路、加价、态度恶劣等行为，乘客可向平台投诉。</text>
							<text class="content-text">4.2 投诉可通过订单页面“联系客服”或拨打客服电话进行，平台将在24小时内受理，7个工作日内反馈处理结果。</text>
							<text class="content-text">4.3 平台为乘客提供行程分享、紧急联系人、一键报警等安全功能，建议乘客在出行时使用。</text>
							<text class="content-text">4.4 若因平台原因导致乘客权益受损，平台将依据相关法律法规承担相应责任。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="五、隐私政策与数据保护">
						<view class="collapse-content">
							<text class="content-text">5.1 平台收集用户手机号、位置信息、订单记录等仅用于提供出行服务，未经用户同意不会向第三方提供。</text>
							<text class="content-text">5.2 为保障安全，平台会对行程录音进行加密存储，仅在安全事件处理或法律需要时调取。</text>
							<text class="content-text">5.3 用户可随时在“设置”中查看或删除个人数据，注销账号后平台将依法删除相关数据。</text>
							<text class="content-text">5.4 平台采用行业标准技术保护数据安全，但无法完全排除第三方攻击风险。如发生数据泄露，将第一时间通知用户。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="六、免责条款">
						<view class="collapse-content">
							<text class="content-text">6.1 平台仅为乘客与司机提供信息撮合服务，不承担运输过程中的直接责任。因交通事故、第三方侵权等造成的损失，由责任方依法承担。</text>
							<text class="content-text">6.2 因不可抗力（如自然灾害、政府管制、网络故障等）导致服务中断或损失的，平台不承担责任。</text>
							<text class="content-text">6.3 用户违反本协议约定导致的任何损失，由用户自行承担。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="七、附则">
						<view class="collapse-content">
							<text class="content-text">7.1 本协议自用户点击“同意”或首次使用平台服务时生效，有效期至协议终止或用户注销账号。</text>
							<text class="content-text">7.2 平台有权根据业务发展或法律法规变化适时修订本协议，修订版本将在平台公示。如用户继续使用服务，视为同意修订后的协议。</text>
							<text class="content-text">7.3 本协议的解释权归迅家出行平台所有，如有争议，双方应友好协商解决；协商不成的，可向平台所在地有管辖权的人民法院提起诉讼。</text>
						</view>
					</uni-collapse-item>
				</uni-collapse>
			</uni-card>
			
			<view class="footer-btn">
				<button class="confirm-btn">您已阅读并同意</button>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	
	const goBack = () => {
		uni.navigateBack();
	};
	
</script>

<style lang="scss" scoped>
	.agreement-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f8f9fc;
	}
	
	.scroll-content {
		flex: 1;
		padding: 20rpx 32rpx 40rpx;
		box-sizing: border-box;
	}
	
	.version-info {
		margin-bottom: 24rpx;
		display: flex;
		justify-content: space-between;
		font-size: 24rpx;
		color: #86909c;
		background: #fff;
		padding: 16rpx 24rpx;
		border-radius: 16rpx;
	}
	
	.intro-card {
		margin-bottom: 24rpx;
		background: linear-gradient(135deg, #5c9ebd 0%, #3c7e8c 100%);
		border-radius: 24rpx;
		
		:deep(.uni-card__content) {
			padding: 32rpx;
		}
		
		.intro-content {
			display: flex;
			flex-direction: column;
			gap: 16rpx;
			
			.intro-title {
				font-size: 36rpx;
				font-weight: 700;
				color: #fff;
			}
			
			.intro-desc {
				font-size: 28rpx;
				color: rgba(255,255,255,0.9);
				line-height: 1.5;
			}
		}
	}
	
	.agreement-card {
		margin-bottom: 40rpx;
		border-radius: 24rpx;
		background: #fff;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
		
		:deep(.uni-card__content) {
			padding: 0;
		}
		
		:deep(.uni-collapse-item) {
			background: #fff;
			border-bottom: 1rpx solid #f0f0f0;
			
			.uni-collapse-item__title {
				padding: 32rpx 32rpx;
				font-size: 32rpx;
				font-weight: 600;
				color: #1f2f3d;
			}
			
			.uni-collapse-item__content {
				padding: 0 32rpx 32rpx;
				background: #fafbfc;
			}
		}
		
		.collapse-content {
			display: flex;
			flex-direction: column;
			gap: 24rpx;
			
			.content-text {
				font-size: 28rpx;
				color: #4a5a6e;
				line-height: 1.6;
			}
		}
	}
	
	.footer-btn {
		margin-top: 20rpx;
		padding-bottom: 40rpx;
		
		.confirm-btn {
			background: linear-gradient(135deg, #5c9ebd, #3c7e8c);
			color: white;
			font-size: 32rpx;
			font-weight: 600;
			border-radius: 60rpx;
			height: 96rpx;
			line-height: 96rpx;
			border: none;
			box-shadow: 0 8rpx 20rpx rgba(60, 126, 140, 0.25);
			transition: all 0.2s;
			
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