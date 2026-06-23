<template>
  <view style="display: none;"></view>
</template>

<script setup>
import { computed, watch, onUnmounted, ref } from 'vue';
import { useStore } from 'vuex';

const $store = useStore();
const userInfo = computed(() => $store.state.userInfo);
const $emits = defineEmits(['receiveMsg']);

const isConnected = ref(false);
let heartTimer = null;

// 监听用户ID
watch(
  () => userInfo.value?.id,
  (id) => {
    if (!id) return;

    // 关闭旧连接
    uni.closeSocket();
    clearInterval(heartTimer);

    const url = `${$store.state.serverConf.sse}/connect/${id}/1`;
    console.log('🔗 乘客连接：', url);

    // ========== uni-app 官方正确写法 ==========
    uni.connectSocket({ url });

    // 连接成功
    uni.onSocketOpen(() => {
      console.log('✅ 乘客 WebSocket 已连接');
      isConnected.value = true;
      startHeartBeat();
    });

    // 接收消息
    uni.onSocketMessage((res) => {
      try {
        const data = JSON.parse(res.data);
        
        // 过滤心跳
        if (data.type === 'pong') {
          // console.log('💓 心跳正常');
          return;
        }

        console.log('📩 乘客收到消息：', data);
        $emits('receiveMsg', data);
      } catch (err) {
        console.error('解析失败', err);
      }
    });

    // 断开重连
    uni.onSocketClose(() => {
      isConnected.value = false;
      setTimeout(() => {
        userInfo.value.id && (() => {})();
      }, 3000);
    });
  },
  { immediate: true }
);

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