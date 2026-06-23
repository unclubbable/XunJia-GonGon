<template>
	<view class="container">
		<view class="logo">迅家出行，一路畅行</view>
		<view class="login">
            <input placeholder="请输入手机号" type="number" maxlength="11" v-model="phone" class="login--input"  />
            <view class="login--code">
                <input placeholder="验证码" type="number" maxlength="6" class="login--input" v-model="code"  />
                <text @click="handleGetVerifyCode" :class="['login--send-btn', {'login--send-btn__disabled':isDisableCode}]">{{codeText}}</text>
            </view>
		</view>
		<button class="login--btn" @click="handleLogin">登录</button>
	</view>
</template>
<script setup>
import { _IsPhone } from '@gykeji/jsutil';			// 第三方手机号验证工具函数
import {computed, onMounted, ref} from 'vue';
import {ApiGetVerifyCode, ApiPostVerifyCodeCheck} from '../api/user'	// 登录相关的接口请求函数
import {HandleApiError, ShowToast} from '../utils';
import {useStore} from 'vuex';	// Vuex状态管理：存取token
// 获取Vuex仓库实例（用于存token）
const $store = useStore();
const token = computed(()=> $store.state.token);
let codeText = ref('获取验证码');
let codeTimerNum = ref(0);
let codeTimer = null;
let isDisableCode = computed(()=> codeTimerNum.value !== 0);
let phone = ref("");		//电话
let code = ref("");			//验证码
//判断是否有token，如果有则自动跳转
onMounted(()=>{
    if(token.value){
        uni.redirectTo({url:'/pages/index'});
    }
})
//发送验证码
async function handleGetVerifyCode(){
    if(isDisableCode.value || !verifyPhone(phone.value)){
        return false;
    }
    // 设置倒计时秒数（10秒）
    codeTimerNum.value = 10;
    // 启动倒计时
    calcTimer();
	
    const {error, result} = await ApiGetVerifyCode({driverPhone:phone.value});
    if(!HandleApiError(error) && !result.hasOwnProperty("code")){
        ShowToast('验证码发送成功');
    }
	else{
		ShowToast('验证码发送失败,请检查账号是否注册,若没注册请联系后台人员注册新用户')
	}
}
//正常登录
async function handleLogin() {
    if(!verifyPhone(phone.value)){
        return false;
    }
    if(!code.value){
        ShowToast('请输入正确验证码');
        return false;
    }

	const res = await ApiPostVerifyCodeCheck({
        driverPhone: phone.value,
	    verificationCode: code.value
	});
	console.log("结果=", res);
	
	
    
    if(!HandleApiError(res.error) && !res.result.hasOwnProperty("code")){
        $store.commit('setToken', res.result.accessToken);
		ShowToast('登录成功')
		uni.redirectTo({url:'/pages/index'});
    }else{
		ShowToast('登录失败');
	}
}

function calcTimer() {
    codeTimerNum.value--;
    if(codeTimerNum.value === 0){
        clearTimeout(codeTimer);
        codeText.value = '获取验证码';
        return false;
    };
    codeText.value = `${codeTimerNum.value}s后重新获取`;
    setTimeout(()=>{
        calcTimer();
    }, 1000)
}
//验证手机号是否正确
function verifyPhone(phone) {
    let result = phone && _IsPhone(phone);
    if(!result){
        ShowToast('请填写正确手机号！');
        result = false;
    }
    return result;
}
// const handleAccount = ()=>{
//     uni.navigateTo({url:'/pages/account'})
// }
</script>

<style lang="scss" scoped>
.logo{
	font-size: 46rpx;
	text-align: center;
	margin: 100rpx 0 84rpx 0;
	font-weight: bold;
}
.login{
	width: 650rpx;
	margin: 0 auto;
	&--input{
		border-bottom: 2rpx solid $uni-border-color;
		width: 650rpx;
		height: 100rpx;
		font-size: $uni-font-size-lg;
	}
	&--code{
		position: relative;
	}
	&--send-btn{
		position: absolute;
		right: 0;
        top: 36rpx;
		color: $uni-color-primary;
		&__disabled{
            color: $uni-text-color-disable;
		}
	}
	&--btn{
		width: 650rpx;
		font-size: $uni-font-size-lg;
		margin-top: 60rpx;
        background: $uni-color-primary;
        color: $uni-text-color-inverse;
	}
}
</style>