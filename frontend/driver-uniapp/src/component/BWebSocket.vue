<template>
	<!-- 纯订阅，无 UI；连接由 App 全局 wsHub 维护 -->
	<view style="display: none;"></view>
</template>

<script setup>
/**
 * 司机端：订阅全局 wsHub 的 order 事件，转发给页面 @receiveOrder
 */
import { onMounted, onUnmounted } from 'vue'
import { onWs } from '../utils/wsHub'

const $emits = defineEmits(['receiveOrder'])

let off = null

onMounted(() => {
	off = onWs('order', (data) => {
		$emits('receiveOrder', data)
	})
})

onUnmounted(() => {
	if (off) off()
	off = null
})
</script>
