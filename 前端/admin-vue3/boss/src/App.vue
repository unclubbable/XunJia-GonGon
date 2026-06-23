<script setup>
import { RouterView } from 'vue-router'
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