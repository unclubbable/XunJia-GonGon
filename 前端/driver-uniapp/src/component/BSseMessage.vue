<template>
  <view style="display: none;"></view>
</template>

<script setup>
import { computed, watch, onUnmounted, ref } from 'vue';
import { useStore } from 'vuex';

const $store = useStore();
const userInfo = computed(() => $store.state.userInfo);
const $emits = defineEmits(['receiveOrder']);

let heartTimer = null;
const isConnected = ref(false);

watch(() => userInfo.value?.driverId, (driverId) => {
  if (!driverId) return;

  // 关闭旧连接
  uni.closeSocket();
  clearInterval(heartTimer);

  const url = `${$store.state.serverConf.sse}/connect/${driverId}/2`;
  console.log('🔗 连接地址：', url);

  // 1. 创建连接
  uni.connectSocket({ url });

  // 2. 连接成功 ✅
  uni.onSocketOpen(() => {
    console.log('✅ WebSocket 连接成功');
    isConnected.value = true;
    startHeartBeat();
  });

  // 3. 接收消息 ✅
  uni.onSocketMessage((res) => {
    try {
      const data = JSON.parse(res.data);
      if (data.type === 'pong') {
		// console.log('💓 心跳正常');
        return;
      }
      console.log('📩 收到订单：', data);
      $emits('receiveOrder', data);
    } catch (e) {}
  });

  // 4. 断开重连
  uni.onSocketClose(() => {
    isConnected.value = false;
    setTimeout(() => {
      userInfo.value.driverId && (() => {})();
    }, 3000);
  });
}, { immediate: true });

// 心跳
function startHeartBeat() {
  heartTimer = setInterval(() => {
    if (isConnected.value) {
      uni.sendSocketMessage({
        data: JSON.stringify({ type: 'heartBeat' })
      });
    }
  }, 10000);
}

onUnmounted(() => {
  uni.closeSocket();
  clearInterval(heartTimer);
});
</script>