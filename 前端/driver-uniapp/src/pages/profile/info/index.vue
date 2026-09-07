<template>
	<view class="personal-info-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">个人信息</text>
			<text class="page-subtitle">信息只读，不可修改</text>
		</view>

		<!-- 基本信息卡片 -->
		<uni-card :is-full="true" class="info-card" :border="false">
			<template v-slot:title>
				<view class="card-header">
					<uni-icons type="person" size="20" color="#318eff" />
					<text>基本信息</text>
				</view>
			</template>
			<uni-forms :model="formData" label-width="140">
				<uni-forms-item label="姓名">
					<uni-easyinput v-model="formData.fullName" disabled />
				</uni-forms-item>
				<uni-forms-item label="手机号">
					<uni-easyinput v-model="formData.driverPhone" disabled />
				</uni-forms-item>
				<uni-forms-item label="性别">
					<uni-easyinput v-model="formData.genderText" disabled />
				</uni-forms-item>
				<uni-forms-item label="民族">
					<uni-easyinput v-model="formData.driverNation" disabled />
				</uni-forms-item>
				<uni-forms-item label="出生日期">
					<uni-easyinput v-model="formData.driverBirthday" disabled />
				</uni-forms-item>
				<uni-forms-item label="通信地址">
					<uni-easyinput v-model="formData.driverContactAddress" disabled />
				</uni-forms-item>
				<uni-forms-item label="注册日期">
					<uni-easyinput v-model="formData.registerDate" disabled />
				</uni-forms-item>
			</uni-forms>
		</uni-card>

		<!-- 驾驶证信息卡片 -->
		<uni-card :is-full="true" class="info-card" :border="false">
			<template v-slot:title>
				<view class="card-header">
					<uni-icons type="starhalf" size="20" color="#318eff" />
					<text>驾驶证信息</text>
				</view>
			</template>
			<uni-forms :model="formData" label-width="140">
				<uni-forms-item label="驾驶证号">
					<uni-easyinput v-model="formData.licenseId" disabled />
				</uni-forms-item>
				<uni-forms-item label="初次领证日期">
					<uni-easyinput v-model="formData.getDriverLicenseDate" disabled />
				</uni-forms-item>
				<uni-forms-item label="驾驶证有效期">
					<uni-easyinput v-model="formData.driverLicensePeriod" disabled />
				</uni-forms-item>
				<uni-forms-item label="出租车驾驶员">
					<uni-easyinput v-model="formData.taxiDriverText" disabled />
				</uni-forms-item>
			</uni-forms>
		</uni-card>

		<!-- 网约车资格证卡片 -->
		<uni-card :is-full="true" class="info-card" :border="false">
			<template v-slot:title>
				<view class="card-header">
					<uni-icons type="paperplane" size="20" color="#318eff" />
					<text>网约车资格证</text>
				</view>
			</template>
			<uni-forms :model="formData" label-width="140">
				<uni-forms-item label="资格证号">
					<uni-easyinput v-model="formData.certificateNo" disabled />
				</uni-forms-item>
				<uni-forms-item label="发证机构">
					<uni-easyinput v-model="formData.networkCarIssueOrganization" disabled />
				</uni-forms-item>
				<uni-forms-item label="发证日期">
					<uni-easyinput v-model="formData.networkCarIssueDate" disabled />
				</uni-forms-item>
				<uni-forms-item label="有效期">
					<uni-easyinput v-model="formData.networkCarProofPeriod" disabled />
				</uni-forms-item>
			</uni-forms>
		</uni-card>

		<!-- 合同信息卡片 -->
		<uni-card :is-full="true" class="info-card" :border="false">
			<template v-slot:title>
				<view class="card-header">
					<uni-icons type="email-filled" size="20" color="#318eff" />
					<text>合同信息</text>
				</view>
			</template>
			<uni-forms :model="formData" label-width="140">
				<uni-forms-item label="合约公司">
					<uni-easyinput v-model="formData.contractCompany" disabled />
				</uni-forms-item>
				<uni-forms-item label="合同类型">
					<uni-easyinput v-model="formData.commercialTypeText" disabled />
				</uni-forms-item>
				<uni-forms-item label="合同有效期">
					<uni-easyinput v-model="formData.contractPeriod" disabled />
				</uni-forms-item>
				<uni-forms-item label="当前状态">
					<uni-easyinput v-model="formData.stateText" disabled />
				</uni-forms-item>
			</uni-forms>
		</uni-card>
	</view>
</template>

<script setup>
	import { ref, reactive } from 'vue';

	const globalUserInfo = getApp().globalData.userInfo || {};

	// 枚举映射
	const genderMap = { 0: '未知', 1: '男', 2: '女' };
	const taxiDriverMap = { 0: '否', 1: '是' };
	const commercialTypeMap = { 1: '全职', 2: '兼职' };
	const stateMap = { 0: '正常', 1: '停用', 2: '待审核' };

	// 智能拼接姓名
	const getFullName = () => {
		const surname = globalUserInfo.driverSurname || '';
		const name = globalUserInfo.driverName || '';
		// 如果 name 已经包含 surname，则直接返回 name，否则拼接
		if (name && surname && name.startsWith(surname)) {
			return name;
		}
		return surname + name;
	};

	const formData = reactive({
		// 基本信息
		fullName: getFullName(),
		driverPhone: globalUserInfo.driverPhone || '',
		genderText: genderMap[globalUserInfo.driverGender] || '未知',
		driverNation: globalUserInfo.driverNation || '',
		driverBirthday: globalUserInfo.driverBirthday || '',
		driverContactAddress: globalUserInfo.driverContactAddress || '',
		registerDate: globalUserInfo.registerDate || '',
		
		// 驾驶证
		licenseId: globalUserInfo.licenseId || '',
		getDriverLicenseDate: globalUserInfo.getDriverLicenseDate || '',
		driverLicensePeriod: `${globalUserInfo.driverLicenseOn || ''} 至 ${globalUserInfo.driverLicenseOff || ''}`,
		taxiDriverText: taxiDriverMap[globalUserInfo.taxiDriver] || '否',
		
		// 网约车资格证
		certificateNo: globalUserInfo.certificateNo || '',
		networkCarIssueOrganization: globalUserInfo.networkCarIssueOrganization || '',
		networkCarIssueDate: globalUserInfo.networkCarIssueDate || '',
		networkCarProofPeriod: `${globalUserInfo.networkCarProofOn || ''} 至 ${globalUserInfo.networkCarProofOff || ''}`,
		
		// 合同信息
		contractCompany: globalUserInfo.contractCompany || '',
		commercialTypeText: commercialTypeMap[globalUserInfo.commercialType] || '未知',
		contractPeriod: `${globalUserInfo.contractOn || ''} 至 ${globalUserInfo.contractOff || ''}`,
		stateText: stateMap[globalUserInfo.state] || '未知'
	});
</script>

<style lang="scss" scoped>
	.personal-info-page {
		min-height: 100vh;
		background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
		padding: 32rpx 32rpx 60rpx;
		box-sizing: border-box;
	}

	.page-header {
		margin-bottom: 32rpx;
		text-align: center;

		.page-title {
			font-size: 44rpx;
			font-weight: 700;
			color: #1f2f3d;
			display: block;
			margin-bottom: 12rpx;
		}

		.page-subtitle {
			font-size: 24rpx;
			color: #318eff;
			background: #e8f3ff;
			padding: 8rpx 24rpx;
			border-radius: 999rpx;
			display: inline-block;
		}
	}

	.info-card {
		margin-bottom: 24rpx !important;
		border-radius: 28rpx;
		background: #ffffff;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);
		overflow: hidden;

		:deep(.uni-card__header) {
			padding: 28rpx 32rpx 16rpx;
			border-bottom: 1rpx solid #f0f2f5;
		}

		:deep(.uni-card__content) {
			padding: 16rpx 32rpx 32rpx;
		}

		.card-header {
			display: flex;
			align-items: center;
			gap: 12rpx;
			font-size: 30rpx;
			font-weight: 600;
			color: #1f2f3d;
		}

		:deep(.uni-forms-item) {
			margin-bottom: 24rpx;

			.uni-forms-item__label {
				font-size: 28rpx;
				font-weight: 500;
				color: #595959;
			}
		}

		:deep(.uni-easyinput) {
			background: #f8f9fc;
			border-radius: 16rpx;
			border: 1px solid #eef0f4;

			&.is-disabled {
				background: #f5f7fa;
				opacity: 1;

				.uni-easyinput__content {
					color: #1f2f3d;
					font-weight: 500;
				}
			}
		}
	}
</style>