<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { getToken, getUserId } from '@/utils/auth'
import { startAdminWs, stopAdminWs, onWs } from '@/utils/wsHub'
import { handleKicked } from '@/utils/kick'

const route = useRoute()
let offForceLogout = null

function syncWs() {
  if (getToken() && getUserId() && route.path !== '/login') {
    startAdminWs()
  } else {
    stopAdminWs()
  }
}

onMounted(() => {
  offForceLogout = onWs('forceLogout', (payload) => {
    const reason = payload?.reason === 'OTHER_LOGIN' ? '账号已在别处登录' : '登录已失效'
    handleKicked(reason)
  })
  syncWs()
})

onUnmounted(() => {
  if (offForceLogout) offForceLogout()
  stopAdminWs()
})

watch(
  () => [route.path, getToken(), getUserId()],
  () => syncWs()
)
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
/* 全局重置：清除默认边距 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 让 html/body/#app 都撑满视口 */
html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden; /* 防止出现滚动条 */
}

/* 容器全屏 */
.app-container {
  width: 100%;
  height: 100%;
}
</style>
