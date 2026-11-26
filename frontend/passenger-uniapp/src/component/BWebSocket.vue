<template>
	<!-- 纯订阅，无 UI；连接由 App 全局 wsHub 维护 -->
	<view style="display: none;"></view>
</template>

<script setup>
/**
 * 乘客端：订阅全局 wsHub 的 order 事件，转发给页面 @receiveMsg
 */
import { onMounted, onUnmounted } from 'vue'
import { onWs } from '../utils/wsHub'

const $emits = defineEmits(['receiveMsg'])

let off = null

onMounted(() => {
	off = onWs('order', (data) => {
		$emits('receiveMsg', data)
	})
})

onUnmounted(() => {
	if (off) off()
	off = null
})
</script>
