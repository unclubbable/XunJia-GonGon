<template>
    <web-view :src="url" />
</template>
<script setup>
import { onLoad,onBackPress } from "@dcloudio/uni-app"
import { ref } from "@vue/reactivity";
import { useStore } from "vuex";
import { ApiGetCurrentOrderDetail } from "../api/order.js"
const $store = useStore()
const orderId = ref('')

let url = ref()
onLoad((option)=>{
    url.value = `${$store.state.serverConf.pay}/alipay/pay?subject=${decodeURIComponent('车费')}&outTradeNo=${option.id}&totalAmount=${option.price}`;
	orderId.value = option.id;
})
onBackPress(async() =>{
	const { error,result } = await ApiGetCurrentOrderDetail({orderId: orderId.value});
	if(result.orderStatus !=7){
	  uni.navigateBack({ delta: 2 })
	  return true // 阻止默认返回行为
	}
})
</script>