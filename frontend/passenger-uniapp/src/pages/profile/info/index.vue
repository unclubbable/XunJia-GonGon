<template>
	<view class="personal-info-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">个人信息</text>
			<text class="page-subtitle">完善资料，享受更贴心服务</text>
		</view>

		<!-- 头像卡片 -->
		<uni-card :is-full="true" :border="false" class="avatar-card">
			<view class="avatar-wrapper" @click="changeAvatar">
				<image class="avatar" :src="avatarUrl" mode="aspectFill"></image>
				<view class="avatar-edit">
					<uni-icons type="camera" size="20" color="#fff" />
				</view>
			</view>
			<text class="avatar-tip">点击更换头像</text>
		</uni-card>

		<!-- 表单卡片 -->
		<uni-card :is-full="true" :border="false" class="form-card">
			<uni-forms ref="formRef" :model="formData" label-width="80">
				<!-- 手机号（只读） -->
				<uni-forms-item label="手机号">
					<uni-easyinput v-model="formData.passengerPhone" disabled />
				</uni-forms-item>

				<!-- 姓氏 -->
				<uni-forms-item label="姓氏" required>
					<uni-easyinput 
						v-model="formData.passengerSurname" 
						placeholder="请输入姓"
						clearable
					/>
				</uni-forms-item>

				<!-- 名字 -->
				<uni-forms-item label="名字" required>
					<uni-easyinput 
						v-model="formData.passengerName" 
						placeholder="请输入名字"
						clearable
					/>
				</uni-forms-item>

				<!-- 性别 -->
				<uni-forms-item label="性别">
					<uni-data-select 
						v-model="formData.passengerGender"
						:localdata="genderOptions"
						placeholder="请选择性别"
					/>
				</uni-forms-item>
			</uni-forms>

			<view class="submit-wrapper">
				<button class="submit-btn" @click="handleSubmit">保存修改</button>
			</view>
		</uni-card>
	</view>
</template>

<script setup>
	import { ref, reactive, computed ,onMounted} from 'vue';
	import { useStore } from 'vuex';
	import {ApiPutUserInfo} from '../../../api/user.js';
	const $store = useStore();
	//用户信息
	const userInfo = computed(() => $store.state.userInfo);

	// 头像URL（优先使用已有头像，否则使用默认）
	const avatarUrl = ref(userInfo.value.profilePhoto || '/static/default-avatar.png');

	// 表单数据
	const formData = reactive({
		passengerPhone: userInfo.value.passengerPhone || '',
		passengerSurname: userInfo.value.passengerSurname || '',
		passengerName: userInfo.value.passengerName || '',
		passengerGender: userInfo.value.passengerGender !== undefined ? userInfo.value.passengerGender : 0,
	});

	// 性别选项（与后端字段对应：0未知，1男，2女）
	const genderOptions = [
		{ text: '男', value: 1 },
		{ text: '女', value: 2 }
	];
	
	/**
	 * 请求相册权限（如果未授权则弹窗引导）
	 * @returns {Promise<boolean>} 是否已获得权限
	 */
	async function requestAlbumPermission() {
	    return new Promise((resolve) => {
	        uni.getSetting({
	            success: (res) => {
	                if (res.authSetting['scope.album']) {
	                    // 已有权限
	                    resolve(true);
	                } else {
	                    // 无权限，尝试申请
	                    uni.authorize({
	                        scope: 'scope.album',
	                        success: () => {
	                            resolve(true);
	                        },
	                        fail: () => {
	                            // 用户拒绝过
	                            resolve(false);
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

	// 更换头像
	const changeAvatar = () => {
		//弹框：让用户获取图片相机权限
		requestAlbumPermission()
		uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			sourceType: ['album', 'camera'],
			success: (res) => {
				const tempFilePath = res.tempFilePaths[0];
				
				// 2. 上传到服务器
				uni.uploadFile({
				  url: 'http://8.140.211.132:7071/passenger-user/passenger-user/upload', // 统一网关乘客端上传接口
				  filePath: tempFilePath,
				  name: 'file', // 后端接收的字段名 99%都是 file
				  header: {
		            // token
		            Authorization: $store.state.token
	    	      },
				  success: (uploadRes) => {
		          
           		    // 后端返回 JSON 要手动转
			        const data = JSON.parse(uploadRes.data)
					console.log(data);
					if(data.code==0){
						console.log('上传头像失败')
					}
					else{
						// 更新图像url
						avatarUrl.value = tempFilePath;
						uni.showToast({ title: '头像已更新', icon: 'none' });
					}
				  },
			      fail: (err) => {
	        	    console.log('上传头像失败', err)
				  }
				})
				
			}
		});
		
		
	};

	// 提交保存
	const handleSubmit =async () => {
		// 简单校验
		if (!formData.passengerSurname || !formData.passengerName) {
			uni.showToast({ title: '请填写完整姓名', icon: 'none' });
			return;
		}

		// 更新 $store 中的用户信息（保留其他字段不变）
		const updatedInfo = {
			...userInfo.value,
			passengerSurname: formData.passengerSurname,
			passengerName: formData.passengerName,
			passengerGender: formData.passengerGender,
			// 头像若已上传，此处应使用服务器返回的 URL，这里仅演示保留原值或新临时路径
			profilePhoto: avatarUrl.value !== '/static/default-avatar.png' ? avatarUrl.value : userInfo.value.profilePhoto,
		};
		
		//后端提交数据
		const { error, result } = await ApiPutUserInfo(updatedInfo);
		if (!error){
			//更新本地数据
			$store.commit('setUserInfo', updatedInfo);

			uni.showToast({
				title: '保存成功',
				icon: 'success',
				duration: 1500
			});
		}
		else{
			uni.showToast({
				title: '保存失败',
				icon: 'error',
				duration: 1500
			});
		}

		
	};
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
			font-size: 26rpx;
			color: #318eff;
			background: #e8f3ff;
			padding: 8rpx 24rpx;
			border-radius: 999rpx;
			display: inline-block;
		}
	}

	.avatar-card {
		margin-bottom: 24rpx;
		background: #ffffff;
		border-radius: 28rpx;
		padding: 48rpx 0 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);

		.avatar-wrapper {
			position: relative;
			width: 168rpx;
			height: 168rpx;
			border-radius: 50%;
			overflow: hidden;
			border: 6rpx solid #e8f3ff;
			box-shadow: 0 8rpx 24rpx rgba(49, 142, 255, 0.15);

			.avatar {
				width: 100%;
				height: 100%;
				background: #eef2f6;
			}

			.avatar-edit {
				position: absolute;
				bottom: 0;
				right: 0;
				background: #318eff;
				border-radius: 50%;
				width: 52rpx;
				height: 52rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				border: 4rpx solid #fff;
			}
		}

		.avatar-tip {
			margin-top: 20rpx;
			font-size: 24rpx;
			color: #86909c;
		}
	}

	.form-card {
		background: #ffffff;
		border-radius: 28rpx;
		padding: 32rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);

		:deep(.uni-forms-item) {
			margin-bottom: 28rpx;

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

			&.is-focus {
				border-color: #318eff;
				box-shadow: 0 0 0 4rpx rgba(49, 142, 255, 0.12);
			}

			&.is-disabled {
				background: #f5f7fa;
				opacity: 1;

				.uni-easyinput__content {
					color: #86909c;
				}
			}
		}

		:deep(.uni-data-select) {
			background: #f8f9fc;
			border-radius: 16rpx;
			border: 1px solid #eef0f4;
			min-height: 88rpx;

			.uni-data-select__input {
				font-size: 28rpx;
				color: #1f2f3d;
			}
		}

		.submit-wrapper {
			margin-top: 48rpx;

			.submit-btn {
				background: linear-gradient(135deg, #318eff, #1a6fe8);
				color: #fff;
				font-size: 32rpx;
				font-weight: 600;
				border-radius: 999rpx;
				height: 96rpx;
				line-height: 96rpx;
				border: none;
				box-shadow: 0 12rpx 28rpx rgba(49, 142, 255, 0.28);

				&::after {
					border: none;
				}

				&:active {
					transform: scale(0.98);
					opacity: 0.92;
				}
			}
		}
	}
</style>