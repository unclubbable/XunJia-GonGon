<template>
	<view class="agreement-page">

		
		<scroll-view scroll-y class="scroll-content">

			
			<!-- 引言 -->
			<uni-card :is-full="true" :border="false" class="intro-card">
				<view class="intro-content">
					<text class="intro-title">欢迎使用迅家出行司机端</text>
					<text class="intro-desc">迅家出行致力于为司机提供安全、高效、公平的出行服务平台。请您在使用本平台前仔细阅读并充分理解本协议的全部内容。</text>
				</view>
			</uni-card>
			
			<!-- 协议主体内容 - 使用折叠面板 -->
			<uni-card :is-full="true" :border="false" class="agreement-card">
				<uni-collapse ref="collapse" accordion>
					<uni-collapse-item title="一、司机入驻与资质要求" open>
						<view class="collapse-content">
							<text class="content-text">1.1 司机必须年满21周岁，持有有效的中华人民共和国机动车驾驶证（准驾车型符合平台要求），且驾龄不低于3年。</text>
							<text class="content-text">1.2 司机需提供本人身份证、驾驶证、行驶证、网络预约出租汽车驾驶员证等真实有效证件，并确保在服务期间持续有效。</text>
							<text class="content-text">1.3 车辆需符合当地网约车运营标准，车况良好，保险齐全（包括交强险、商业第三者责任险等）。</text>
							<text class="content-text">1.4 平台对司机资质进行审核，审核通过后方可接单。如资质过期或失效，平台有权暂停服务直至重新审核通过。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="二、服务规范与行为准则">
						<view class="collapse-content">
							<text class="content-text">2.1 司机应保持良好的仪容仪表，车辆内外整洁卫生，使用文明用语，尊重乘客。</text>
							<text class="content-text">2.2 接单后应及时联系乘客确认上车位置，准时到达，不得无故拒载、中途甩客、绕路或加价。</text>
							<text class="content-text">2.3 严格按照平台导航路线行驶，如乘客要求变更路线，需征得乘客同意并保留记录。</text>
							<text class="content-text">2.4 服务过程中不得有吸烟、饮酒、使用手机等危险驾驶行为，不得搭载与订单无关的人员。</text>
							<text class="content-text">2.5 如遇乘客遗失物品，应主动联系乘客归还，或上交至平台客服处理。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="三、费用结算与奖励机制">
						<view class="collapse-content">
							<text class="content-text">3.1 平台根据订单实际里程、时长及动态溢价计算车费，乘客支付后，平台将按约定比例进行结算，通常于订单完成后24小时内到账司机钱包。</text>
							<text class="content-text">3.2 司机可随时申请提现，提现手续费及到账时间以平台公示为准。</text>
							<text class="content-text">3.3 平台可能根据运营活动设置冲单奖励、高峰奖励、服务分奖励等，具体规则以活动页面说明为准。</text>
							<text class="content-text">3.4 若乘客投诉成立或司机存在违规行为，平台有权扣除相应费用或取消奖励。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="四、违规处理与信用体系">
						<view class="collapse-content">
							<text class="content-text">4.1 平台建立司机信用分制度，初始分为12分，根据服务质量、订单完成率、乘客评价等进行动态调整。</text>
							<text class="content-text">4.2 违规行为包括但不限于：拒单、迟到、绕路、态度恶劣、危险驾驶、违规收费等。每次违规将扣除相应信用分，并可能暂停服务权限。</text>
							<text class="content-text">4.3 信用分低于6分时，平台将限制接单；低于0分时，永久终止合作。司机可通过后续优质服务逐步恢复信用分。</text>
							<text class="content-text">4.4 严重违规（如违法犯罪、严重交通事故、欺诈等）将立即封禁账号，并移交司法机关处理。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="五、平台责任与免责">
						<view class="collapse-content">
							<text class="content-text">5.1 平台为司机和乘客提供信息撮合服务，不承担实际运输过程中的风险。司机需自行承担运营过程中可能发生的交通事故、人身伤害等责任。</text>
							<text class="content-text">5.2 因不可抗力（如自然灾害、政府管制、网络故障等）导致服务中断或损失的，平台不承担责任。</text>
							<text class="content-text">5.3 平台有权根据法律法规或业务需要调整协议内容，并提前公示。如司机继续使用平台服务，视为同意修改后的协议。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="六、隐私保护与数据安全">
						<view class="collapse-content">
							<text class="content-text">6.1 平台收集司机的个人信息仅用于身份核验、订单匹配、安全保障及法律法规要求，未经司机同意不会向第三方提供。</text>
							<text class="content-text">6.2 司机应妥善保管账号密码，不得将账号转借他人使用。因账号泄露造成的损失由司机自行承担。</text>
							<text class="content-text">6.3 平台采用加密技术保护数据安全，但无法保证绝对安全。如发生数据泄露事件，平台将及时通知并采取补救措施。</text>
						</view>
					</uni-collapse-item>
					
					<uni-collapse-item title="七、附则">
						<view class="collapse-content">
							<text class="content-text">7.1 本协议自司机点击“同意”或首次使用平台服务时生效，有效期至协议终止或司机注销账号。</text>
							<text class="content-text">7.2 本协议的解释权归迅家出行平台所有，如有争议，双方应友好协商解决；协商不成的，任何一方均可向平台所在地有管辖权的人民法院提起诉讼。</text>
							<text class="content-text">7.3 本协议以中文书写，其他语言版本仅供参考，如有歧义以中文版本为准。</text>
						</view>
					</uni-collapse-item>
				</uni-collapse>
			</uni-card>
			
			<!-- 底部确认按钮 -->
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
		
		// 折叠面板样式
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