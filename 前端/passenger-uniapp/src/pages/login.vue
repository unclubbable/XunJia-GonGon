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
		<button class="login--btn" @click="handleLogin">登录或注册</button>
	</view>
</template>
<script setup>
import { _IsPhone } from '@gykeji/jsutil';
import {computed, onMounted, ref} from 'vue';
import {ApiGetVerifyCode, ApiPostVerifyCodeCheck, ApiGetUserInfo} from '../api/user'
import {HandleApiError, ShowToast} from '../utils';
import {useStore} from 'vuex';

const $store = useStore();
const token = computed(()=> $store.state.token);
let codeText = ref('获取验证码');
let codeTimerNum = ref(0);
let codeTimer = null;
let isDisableCode = computed(()=> codeTimerNum.value !== 0);
let phone = ref('');
let code = ref('');

const handleGetVerifyCode = async () =>{
    if(isDisableCode.value || !verifyPhone(phone.value)){
        return false;
    }
    codeTimerNum.value = 10;
    calcTimer();
    const {error, result} = await ApiGetVerifyCode({passengerPhone:phone.value});
    console.log(error, {passengerPhone:phone.value})
    if(!HandleApiError(error) && !result.hasOwnProperty("code")){
        ShowToast('验证码发送成功');
    }
    
}
/**
 * @Description: 获取用户信息
 * @return {*}
 */
const getUserInfo = async () => {
  const { error, result } = await ApiGetUserInfo();
  if (!result.hasOwnProperty("code")) {
    $store.commit("setUserInfo", result);
  }
};

const handleLogin = async () =>{
    if(!verifyPhone(phone.value)){
        return false;
    }
    if(!code.value){
        ShowToast('请输入正确验证码');
        return false;
    }
    const {error, result} = await ApiPostVerifyCodeCheck({
        passengerPhone: phone.value,
        verificationCode: code.value
    });
	if(!HandleApiError(error) && result.hasOwnProperty("code")){
		ShowToast(result.message);
	}else{
		$store.commit('setToken', result.accessToken);
		getUserInfo();
		uni.reLaunch({url:'/pages/index/index'});
	}
}
const calcTimer = () =>{
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
const verifyPhone = (phone) =>{
    let result = phone && _IsPhone(phone);
    if(!result){
        ShowToast('请填写正确手机号！');
        result = false;
    }
    return result;
}

// const handleAccount = ()=>{
//     uni.switchTab({url:'/pages/account'})
// }
// const clear = () =>{
//     uni.clearStorageSync();
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